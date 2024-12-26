module.exports = {
    database: {
        type: "sqlite",
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
            password: "password",
            database: "app_db"
        }
    }
};
