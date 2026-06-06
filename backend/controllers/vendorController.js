import db from '../config/db.js';
import { logActivity } from '../utils/logger.js';

// @desc    Get all vendor profiles (with search and filter)
// @route   GET /api/vendors
// @access  Private (Admin / Manager / Procurement)
export const getVendors = async (req, res) => {
  const { search, category, status } = req.query;

  try {
    let query = `
      SELECT vp.*, u.name AS contact_name, u.email AS contact_email
      FROM vendor_profiles vp
      JOIN users u ON vp.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (vp.company_name LIKE ? OR u.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category && category !== 'All') {
      query += ` AND vp.category = ?`;
      params.push(category);
    }

    if (status && status !== 'All') {
      query += ` AND vp.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY vp.rating DESC, vp.company_name ASC`;

    const [vendors] = await db.query(query, params);
    res.json(vendors);
  } catch (error) {
    console.error('Get Vendors Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching vendors.', error: error.message });
  }
};

// @desc    Get or create vendor profile for logged-in vendor
// @route   GET /api/vendors/profile
// @access  Private (Vendor)
export const getMyVendorProfile = async (req, res) => {
  try {
    if (req.user.role !== 'Vendor') {
      return res.status(403).json({ message: 'Only vendors can access vendor profile details.' });
    }

    const [profiles] = await db.query('SELECT * FROM vendor_profiles WHERE user_id = ?', [req.user.id]);
    
    if (profiles.length === 0) {
      // Lazily create vendor profile if it doesn't exist
      const companyName = `${req.user.name} Corp`;
      const [result] = await db.query(
        'INSERT INTO vendor_profiles (user_id, company_name) VALUES (?, ?)',
        [req.user.id, companyName]
      );
      
      const [newProfiles] = await db.query('SELECT * FROM vendor_profiles WHERE id = ?', [result.insertId]);
      return res.json(newProfiles[0]);
    }

    res.json(profiles[0]);
  } catch (error) {
    console.error('Get Vendor Profile Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching profile.', error: error.message });
  }
};

// @desc    Create or update vendor profile details
// @route   POST /api/vendors/profile
// @access  Private (Vendor / Admin)
export const updateVendorProfile = async (req, res) => {
  const { company_name, category, gst_number, phone, address } = req.body;

  try {
    if (!company_name || !category || !gst_number || !phone) {
      return res.status(400).json({ message: 'Please provide company name, category, GST number, and phone number.' });
    }

    // Check if vendor profile already exists
    const [profiles] = await db.query('SELECT * FROM vendor_profiles WHERE user_id = ?', [req.user.id]);

    if (profiles.length === 0) {
      // Create new profile
      await db.query(
        'INSERT INTO vendor_profiles (user_id, company_name, category, gst_number, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, company_name, category, gst_number, phone, address]
      );
      await logActivity(req.user.id, 'Create Vendor Profile', `Registered vendor profile for ${company_name}`);
    } else {
      // Update profile
      await db.query(
        'UPDATE vendor_profiles SET company_name = ?, category = ?, gst_number = ?, phone = ?, address = ? WHERE user_id = ?',
        [company_name, category, gst_number, phone, address, req.user.id]
      );
      await logActivity(req.user.id, 'Update Vendor Profile', `Updated vendor profile for ${company_name}`);
    }

    const [updated] = await db.query('SELECT * FROM vendor_profiles WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'Vendor profile updated successfully.', profile: updated[0] });

  } catch (error) {
    console.error('Update Vendor Profile Error:', error.message);
    res.status(500).json({ message: 'Server error while updating profile.', error: error.message });
  }
};

// @desc    Update Vendor verification status (Admin only)
// @route   PUT /api/vendors/:id/status
// @access  Private (Admin)
export const updateVendorStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const validStatuses = ['Active', 'Pending Approval', 'Suspended'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid vendor status selection.' });
    }

    const [profiles] = await db.query('SELECT * FROM vendor_profiles WHERE id = ?', [id]);
    if (profiles.length === 0) {
      return res.status(404).json({ message: 'Vendor profile not found.' });
    }

    const profile = profiles[0];
    await db.query('UPDATE vendor_profiles SET status = ? WHERE id = ?', [status, id]);
    
    await logActivity(req.user.id, 'Update Vendor Status', `Status of vendor ${profile.company_name} updated to ${status}`);

    res.json({ message: `Vendor status updated to ${status} successfully.`, vendor_id: id, status });
  } catch (error) {
    console.error('Update Vendor Status Error:', error.message);
    res.status(500).json({ message: 'Server error while updating vendor status.', error: error.message });
  }
};
