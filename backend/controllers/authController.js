import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_vendorbridge_key_12345';

// Email validation regex helper
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

// @desc    Register a new user
// @route   POST /register
// @access  Public
export const registerUser = async (req, res) => {
  const { email, password, role, first_name, last_name, phone_number, country, additional_info } = req.body;

  try {
    // 1. Basic validation
    if (!first_name || !last_name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please provide first name, last name, email, password, and role.' });
    }

    // Combine for name column representation
    const name = `${first_name} ${last_name}`.trim();

    // 2. Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }

    // 3. Validate role
    const validRoles = ['Admin', 'Procurement Officer', 'Vendor', 'Manager'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role selection.' });
    }

    // 4. Check if user already exists
    const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // 5. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 6. Insert user into database
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role, first_name, last_name, phone_number, country, additional_info) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, first_name, last_name, phone_number || null, country || null, additional_info || null]
    );

    const userId = result.insertId;

    // 6b. Auto-create vendor profile if registering as a Vendor
    if (role === 'Vendor') {
      const companyName = `${name} Corp`;
      await db.query(
        'INSERT INTO vendor_profiles (user_id, company_name, phone, address) VALUES (?, ?, ?, ?)',
        [userId, companyName, phone_number || null, country ? `${country}. ${additional_info || ''}`.trim() : null]
      );
    }

    // 7. Generate JWT token
    const token = jwt.sign(
      { id: userId, name, email, role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        name,
        email,
        role
      }
    });

  } catch (error) {
    console.error('Registration Error:', error.message);
    res.status(500).json({ message: 'Server error during registration.', error: error.message });
  }
};

// @desc    Authenticate a user & get token
// @route   POST /login
// @access  Public
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Validate fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' });
    }

    // 2. Fetch user from database
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = users[0];

    // Check if account is disabled
    if (user.status === 'Disabled') {
      return res.status(403).json({ message: 'Your account has been disabled. Please contact the administrator.' });
    }

    // 3. Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // 4. Generate token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ message: 'Server error during login.', error: error.message });
  }
};
