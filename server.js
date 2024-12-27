const http = require('http');
const WebSocket = require('ws');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { initializeDatabase, getSequelizeInstance } = require('./database/database');
const UserModel = require('./database/models/user');
const TransactionModel = require('./database/models/transactions');
const WalletModel = require('./database/models/wallet');
const auth = require('./middleware/auth');

const chalk = require('chalk');

const app = express();
app.use(express.json());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname)));
// Update static file serving
app.use(express.static(path.join(__dirname, 'public')));

let currentSpeed = 1;
const SECRET_KEY = 'your_secret_key';

// Initialize database and models
(async () => {
    try {
        await initializeDatabase();
        const sequelize = getSequelizeInstance();

        console.log('Sequelize instance in server.js after initializeDatabase:', sequelize);

        const User = UserModel(sequelize);
        console.log('User model initialized successfully.');

        const Transaction = TransactionModel(sequelize);
        console.log('Transaction model initialized successfully.');

        const Wallet = WalletModel(sequelize);
        console.log('Wallet model initialized successfully.');

        try {
            await sequelize.sync({ alter: true });
            console.log(chalk.green('All models synchronized successfully with the selected database.'));
        } catch (error) {
            console.error(chalk.red('Error syncing models:', error));
            process.exit(1);
        }

        startWaitingPeriod();
    } catch (error) {
        console.error(chalk.red('Failed to initialize server:', error));
        process.exit(1);
    }
})();

// Register route
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    try {
        const sequelize = getSequelizeInstance();
        const User = UserModel(sequelize);

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ username, password: hashedPassword });

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        res.status(201).json({ 
            message: 'User registered successfully.',
            userId: user.id,
            token
        });
    } catch (error) {
        console.error(chalk.red('Error during registration:', error));
        res.status(500).json({ error: 'Registration failed. Username may already be taken.' });
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    try {
        const sequelize = getSequelizeInstance();
        const User = UserModel(sequelize);

        const user = await User.findOne({ where: { username } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        res.json({ 
            message: 'Login successful.',
            token,
            userId: user.id,
            username: user.username
        });
    } catch (error) {
        console.error(chalk.red('Error during login:', error));
        res.status(500).json({ error: 'Login failed.' });
    }
});

// Profile route with auth middleware
app.get('/profile', auth, async (req, res) => {
    try {
        const sequelize = getSequelizeInstance();
        const User = UserModel(sequelize);

        const user = await User.findByPk(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        
        res.json({ 
            message: 'Profile fetched successfully.',
            user: {
                id: user.id,
                username: user.username
            }
        });
    } catch (error) {
        console.error(chalk.red('Error during profile fetch:', error));
        res.status(500).json({ error: 'Failed to fetch profile.' });
    }
});

// Add before WebSocket setup
app.get('/dashboard', auth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Update static file serving
app.use(express.static('public'));

// WebSocket server setup
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = [];
let isGameActive = false;
let crashPoint = 0;

const speedSettings = {
    1: { updateInterval: 100 },
    2: { updateInterval: 75 },
    3: { updateInterval: 50 },
};

function generateCrashPoint() {
    return (Math.random() * (10 - 1.1) + 1.1).toFixed(2);
}

function broadcast(data) {
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

function startWaitingPeriod() {
    let countdown = 8;
    isGameActive = false;

    const interval = setInterval(() => {
        broadcast({ event: 'waiting', countdown });
        countdown--;

        if (countdown < 0) {
            clearInterval(interval);
            startGame();
        }
    }, 1000);
}

function startGame() {
    crashPoint = generateCrashPoint();
    isGameActive = true;
    let multiplier = 1.0;
    const startTime = Date.now();

    const { updateInterval } = speedSettings[currentSpeed];
    const baseRate = 0.005;
    const accelerationFactor = 10000;
    const maxGrowthRate = 0.1;

    broadcast({ event: 'game_start', speed: currentSpeed });

    const gameInterval = setInterval(() => {
        const timeElapsed = Date.now() - startTime;

        if (multiplier >= 1.25) {
            const growth = timeElapsed / (accelerationFactor * multiplier);
            multiplier += baseRate + Math.min(growth, maxGrowthRate);
        } else {
            multiplier += baseRate;
        }

        if (multiplier >= crashPoint) {
            clearInterval(gameInterval);
            crashGame();
        } else {
            broadcast({ event: 'progress', multiplier: multiplier.toFixed(2) });
        }
    }, updateInterval);
}

function crashGame() {
    isGameActive = false;
    broadcast({ event: 'crash', multiplier: crashPoint });
    setTimeout(startWaitingPeriod, 2000);
}

wss.on('connection', ws => {
    clients.push(ws);

    ws.on('close', () => {
        const index = clients.indexOf(ws);
        if (index !== -1) {
            clients.splice(index, 1);
        }
    });

    ws.send(JSON.stringify({ event: 'connected', message: 'Welcome to the crash game!' }));
});

server.listen(8080, () => {
    console.log('Server running at http://localhost:8080');
});
