import fs from 'fs';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  console.log("Starting DB Setup...");
  // Connect without database first
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  console.log("Dropping existing database if exists...");
  await connection.query('DROP DATABASE IF EXISTS vendorbridge');

  console.log("Connected to MySQL server. Executing schema.sql...");
  const sql = fs.readFileSync('schema.sql', 'utf8');
  await connection.query(sql);
  console.log("schema.sql executed successfully!");

  // Switch to database
  await connection.query('USE vendorbridge');

  // Insert mock users if they don't exist
  const salt = await bcrypt.genSalt(10);
  const hashedPwd = await bcrypt.hash('password123', salt);

  const users = [
    {
      name: 'Admin User',
      email: 'admin@vendorbridge.com',
      password: hashedPwd,
      role: 'Admin',
      first_name: 'Admin',
      last_name: 'User',
      phone_number: '8888888888',
      country: 'India',
      additional_info: 'Administrator Account'
    },
    {
      name: 'Procurement Officer',
      email: 'officer@vendorbridge.com',
      password: hashedPwd,
      role: 'Procurement Officer',
      first_name: 'Procurement',
      last_name: 'Officer',
      phone_number: '9999999999',
      country: 'India',
      additional_info: 'Officer Account'
    },
    {
      name: 'Rahul Mehta',
      email: 'rahul@vendorbridge.com',
      password: hashedPwd,
      role: 'Manager',
      first_name: 'Rahul',
      last_name: 'Mehta',
      phone_number: '9812345678',
      country: 'India',
      additional_info: 'Procurement head'
    },
    {
      name: 'Priya Shah',
      email: 'priya@vendorbridge.com',
      password: hashedPwd,
      role: 'Manager',
      first_name: 'Priya',
      last_name: 'Shah',
      phone_number: '9876543210',
      country: 'India',
      additional_info: 'Finance manager'
    },
    {
      name: 'Infra Supplies',
      email: 'infra@vendorbridge.com',
      password: hashedPwd,
      role: 'Vendor',
      first_name: 'Infra',
      last_name: 'Supplies',
      phone_number: '9876543210',
      country: 'India',
      additional_info: 'Supplier of premium office furniture'
    },
    {
      name: 'Techcore LTD',
      email: 'techcore@vendorbridge.com',
      password: hashedPwd,
      role: 'Vendor',
      first_name: 'Techcore',
      last_name: 'LTD',
      phone_number: '9876543211',
      country: 'India',
      additional_info: 'IT Solutions provider'
    }
  ];

  for (const u of users) {
    const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [u.email]);
    if (existing.length === 0) {
      const [res] = await connection.query(
        'INSERT INTO users (name, email, password, role, first_name, last_name, phone_number, country, additional_info) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [u.name, u.email, u.password, u.role, u.first_name, u.last_name, u.phone_number, u.country, u.additional_info]
      );
      const userId = res.insertId;

      if (u.role === 'Vendor') {
        const companyName = u.name;
        const category = u.email === 'infra@vendorbridge.com' ? 'Furniture' : 'IT';
        const gstNumber = u.email === 'infra@vendorbridge.com' ? '27AAACS1924B1Z0' : '27AAACT1924B1Z1';
        const rating = u.email === 'infra@vendorbridge.com' ? 4.80 : 4.50;

        await connection.query(
          'INSERT INTO vendor_profiles (user_id, company_name, category, gst_number, phone, address, status, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [userId, companyName, category, gstNumber, u.phone_number, 'Mumbai HQ, India', 'Active', rating]
        );
      }
      console.log(`Inserted user: ${u.email}`);
    } else {
      console.log(`User already exists: ${u.email}`);
    }
  }

  // Fetch user IDs for logs attribution
  const [officerRows] = await connection.query('SELECT id FROM users WHERE email = "officer@vendorbridge.com"');
  const [rahulRows] = await connection.query('SELECT id FROM users WHERE email = "rahul@vendorbridge.com"');
  
  const officerId = officerRows[0]?.id || null;
  const rahulId = rahulRows[0]?.id || null;

  console.log("Seeding Screen 10 Activity Logs...");
  const mockLogs = [
    {
      user_id: officerId,
      action: 'Quotation selected',
      details: 'Infra supplies pvt ltd selected for office furniture Q2',
      created_at: '2025-05-23 21:15:00'
    },
    {
      user_id: rahulId,
      action: 'Approval pending',
      details: 'PO-2024 awaiting L2 approval by priya shah',
      created_at: '2025-05-22 09:15:00'
    },
    {
      user_id: officerId,
      action: 'RFQ published',
      details: 'office furniture Q2 sent to 3 vendors',
      created_at: '2025-05-19 12:00:00'
    },
    {
      user_id: null,
      action: 'Vendor added',
      details: 'FastLog transport registered and pending verifications',
      created_at: '2025-05-18 15:20:00'
    }
  ];

  for (const log of mockLogs) {
    await connection.query(
      'INSERT INTO activity_logs (user_id, action, details, created_at) VALUES (?, ?, ?, ?)',
      [log.user_id, log.action, log.details, log.created_at]
    );
  }
  console.log("Seeded activity logs!");

  await connection.end();
  console.log("DB Setup Completed Successfully!");
}

run().catch(err => {
  console.error("DB Setup Error:", err);
  process.exit(1);
});
