import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'vendorbridge',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper to check connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Successfully connected to MySQL database: ' + (process.env.DB_NAME || 'vendorbridge'));
    connection.release();
  } catch (err) {
    console.error('Database connection failed:', err.message);
    console.error('Make sure XAMPP / MySQL server is running.');
  }
}

testConnection();

export default pool;
