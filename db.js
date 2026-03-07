const mysql = require("mysql2");

const connection = mysql.createConnection(process.env.DATABASE_URL);

connection.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to Railway MySQL");
  }
});

module.exports = connection;


















// import mysql from "mysql2";
// import dotenv from "dotenv";

// dotenv.config();

// const pool = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   port: process.env.DB_Port,
//   waitForConnections: true,
//   connectionLimit: 10,
// });

// pool.getConnection((err, connection) => {
//   if (err) {
//     console.error("Database connection failed:", err);
//   } else {
//     console.log("Connected to MySQL database");
//     connection.release();
//   }
// });

// export default pool.promise();