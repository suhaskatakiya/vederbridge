import db from '../config/db.js';

// @desc    Create a new RFQ
// @route   POST /api/rfqs
// @access  Private (Procurement Officer / Admin)
export const createRFQ = async (req, res) => {
  const { title, product_details, quantity, deadline } = req.body;

  try {
    if (!title || !product_details || !quantity || !deadline) {
      return res.status(400).json({ message: 'All RFQ fields (title, product_details, quantity, deadline) are required.' });
    }

    if (isNaN(quantity) || parseInt(quantity) <= 0) {
      return res.status(400).json({ message: 'Quantity must be a positive number.' });
    }

    // Ensure the user is a Procurement Officer or Admin
    if (req.user.role !== 'Procurement Officer' && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only Procurement Officers or Admins can create RFQs.' });
    }

    const [result] = await db.query(
      'INSERT INTO rfqs (title, product_details, quantity, deadline, created_by) VALUES (?, ?, ?, ?, ?)',
      [title, product_details, parseInt(quantity), deadline, req.user.id]
    );

    res.status(201).json({
      message: 'RFQ created successfully',
      rfq: {
        id: result.insertId,
        title,
        product_details,
        quantity: parseInt(quantity),
        deadline,
        created_by: req.user.id,
        status: 'Open'
      }
    });

  } catch (error) {
    console.error('Create RFQ Error:', error.message);
    res.status(500).json({ message: 'Server error while creating RFQ.', error: error.message });
  }
};

// @desc    Fetch all active/open RFQs
// @route   GET /api/rfqs
// @access  Private
export const getRFQs = async (req, res) => {
  try {
    // Select RFQs and join with user table to get creator name
    const [rfqs] = await db.query(`
      SELECT r.*, u.name AS creator_name 
      FROM rfqs r 
      LEFT JOIN users u ON r.created_by = u.id 
      ORDER BY r.created_at DESC
    `);
    
    res.json(rfqs);
  } catch (error) {
    console.error('Fetch RFQs Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching RFQs.', error: error.message });
  }
};
