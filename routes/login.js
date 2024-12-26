const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getSequelizeInstance } = require('../database/database');
const UserModel = require('../database/models/user');

const router = express.Router();
const SECRET_KEY = 'your_secret_key';

router.post('/login', async (req, res) => {
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

        const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ message: 'Login successful.', token });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Login failed.' });
    }
});

module.exports = router;
