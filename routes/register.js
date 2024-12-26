const express = require('express');
const bcrypt = require('bcrypt');
const { getSequelizeInstance } = require('../database/database');
const UserModel = require('../database/models/user');

const router = express.Router();

router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    try {
        const sequelize = getSequelizeInstance();
        const User = UserModel(sequelize);

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ username, password: hashedPassword });

        res.status(201).json({ message: 'User registered successfully.', userId: user.id });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ error: 'Registration failed. Username may already be taken.' });
    }
});

module.exports = router;
