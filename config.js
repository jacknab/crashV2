module.exports = {
    database: {
        type: "postgresql",
        sqlite: {
            path: "./data/database.sqlite"
        },
        mysql: {
            host: "localhost",
            port: 3306,
            user: "root",
            password: "password",
            database: "app_db"
        },
        postgresql: {
            host: "localhost",
            port: 5432,
            user: "postgres",
            password: "1825Logan305",
            database: "app_db"
        }
    }
};
