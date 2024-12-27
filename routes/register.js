const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getSequelizeInstance } = require('../database/database');
const UserModel = require('../database/models/user');

const JWT_SECRET = 'your-secret-key'; // Move to .env file in production

const router = express.Router();

router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    try {
        const sequelize = getSequelizeInstance();
        const User = UserModel(sequelize);

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ 
            username, 
            password: hashedPassword 
        });

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Registration successful',
            token,
            userId: user.id
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

module.exports = router;