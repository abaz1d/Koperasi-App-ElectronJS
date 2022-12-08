const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    user: "postgres" || process.env.DB_USER,
    host: "localhost" || process.env.DB_HOST,
    database: "cashierdb" || process.env.DB_DATABASE,
    password: "1234" || process.env.DB_PASSWORD,
    port: 5432 || process.env.DB_PORT,
});

module.exports = pool;