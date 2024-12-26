const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    if (!sequelize) {
        console.error('Sequelize instance is undefined in user.js');
        throw new Error('Sequelize instance is required to initialize the User model');
    }

    return sequelize.define('User', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'active'
        },
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE
    });
};
