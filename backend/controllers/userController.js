import db from '../config/db.js';
import bcrypt from 'bcryptjs';
import { logActivity } from '../utils/logger.js';

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin Only)
export const getUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, email, role, first_name, last_name, phone_number, country, additional_info, status, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (error) {
    console.error('Get Users Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching users.', error: error.message });
  }
};

// @desc    Toggle user status (Active / Disabled)
// @route   PUT /api/users/:id/status
// @access  Private (Admin Only)
export const toggleUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    if (!status || !['Active', 'Disabled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status selection.' });
    }

    const [users] = await db.query('SELECT name FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await db.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);

    await logActivity(
      req.user.id,
      'User Status Changed',
      `User ${users[0].name} status updated to ${status}`
    );

    res.json({ message: `User status successfully updated to ${status}.` });
  } catch (error) {
    console.error('Toggle User Status Error:', error.message);
    res.status(500).json({ message: 'Server error during status update.', error: error.message });
  }
};

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private (Admin Only)
export const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    const validRoles = ['Admin', 'Procurement Officer', 'Vendor', 'Manager'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role selection.' });
    }

    const [users] = await db.query('SELECT name FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);

    await logActivity(
      req.user.id,
      'User Role Updated',
      `User ${users[0].name} role changed to ${role}`
    );

    res.json({ message: `User role successfully updated to ${role}.` });
  } catch (error) {
    console.error('Update User Role Error:', error.message);
    res.status(500).json({ message: 'Server error during role update.', error: error.message });
  }
};

// @desc    Update profile details
// @route   PUT /api/users/profile
// @access  Private (Any authenticated user)
export const updateProfile = async (req, res) => {
  const { first_name, last_name, phone_number, country, additional_info, password } = req.body;
  const userId = req.user.id;

  try {
    // 1. Fetch current details
    const [users] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const updates = [];
    const values = [];

    if (first_name) {
      updates.push('first_name = ?');
      values.push(first_name);
    }
    if (last_name) {
      updates.push('last_name = ?');
      values.push(last_name);
    }

    // Derive name if first or last name is updated
    if (first_name || last_name) {
      const [currUser] = await db.query('SELECT first_name, last_name FROM users WHERE id = ?', [userId]);
      const fName = first_name || currUser[0].first_name || '';
      const lName = last_name || currUser[0].last_name || '';
      updates.push('name = ?');
      values.push(`${fName} ${lName}`.trim());
    }

    if (phone_number !== undefined) {
      updates.push('phone_number = ?');
      values.push(phone_number);
    }
    if (country !== undefined) {
      updates.push('country = ?');
      values.push(country);
    }
    if (additional_info !== undefined) {
      updates.push('additional_info = ?');
      values.push(additional_info);
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updates.push('password = ?');
      values.push(hashedPassword);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No profile details provided for update.' });
    }

    values.push(userId);
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    await logActivity(
      userId,
      'Profile Updated',
      'User successfully updated profile details'
    );

    res.json({ message: 'Profile details successfully updated.' });
  } catch (error) {
    console.error('Update Profile Error:', error.message);
    res.status(500).json({ message: 'Server error during profile update.', error: error.message });
  }
};
