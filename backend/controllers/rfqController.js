import db from '../config/db.js';
import { logActivity } from '../utils/logger.js';

// @desc    Create a new RFQ (Screen 5 Stepper workflow)
// @route   POST /api/rfqs
// @access  Private (Procurement Officer / Admin)
export const createRFQ = async (req, res) => {
  const { title, product_details, deadline, assigned_category, attachment_url, line_items, assigned_vendors } = req.body;

  // line_items should be an array of { item_name, quantity, unit }
  // assigned_vendors is optional category or explicit list of company names, we log it for the mock.
  
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    if (!title || !deadline || !line_items || !Array.isArray(line_items) || line_items.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Title, deadline, and at least one line item are required.' });
    }

    // 1. Calculate overall sum of quantity
    const totalQty = line_items.reduce((sum, item) => sum + parseInt(item.quantity || 0), 0);

    // 2. Insert into rfqs
    const [rfqResult] = await connection.query(
      'INSERT INTO rfqs (title, product_details, quantity, deadline, created_by, assigned_category, attachment_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        title,
        product_details || `Procurement of ${line_items.map(i => `${i.item_name} (x${i.quantity})`).join(', ')}`,
        totalQty,
        deadline,
        req.user.id,
        assigned_category || 'All',
        attachment_url || null
      ]
    );

    const rfqId = rfqResult.insertId;

    // 3. Insert line items
    for (const item of line_items) {
      if (!item.item_name || !item.quantity) {
        throw new Error('Each line item must have a name and quantity.');
      }
      await connection.query(
        'INSERT INTO rfq_items (rfq_id, item_name, quantity, unit) VALUES (?, ?, ?, ?)',
        [rfqId, item.item_name, parseInt(item.quantity), item.unit || 'NOS']
      );
    }

    await connection.commit();

    await logActivity(
      req.user.id,
      'Create RFQ',
      `Posted RFQ #${rfqId}: "${title}" with ${line_items.length} line items (Total Qty: ${totalQty})`
    );

    res.status(201).json({
      message: 'RFQ created successfully with line items.',
      rfq_id: rfqId
    });

  } catch (error) {
    await connection.rollback();
    console.error('Create RFQ Error:', error.message);
    res.status(500).json({ message: error.message || 'Server error while creating RFQ.', error: error.message });
  } finally {
    connection.release();
  }
};

// @desc    Fetch all active/open RFQs with line items
// @route   GET /api/rfqs
// @access  Private
export const getRFQs = async (req, res) => {
  try {
    // Select RFQs
    const [rfqs] = await db.query(`
      SELECT r.*, u.name AS creator_name 
      FROM rfqs r 
      LEFT JOIN users u ON r.created_by = u.id 
      ORDER BY r.created_at DESC
    `);
    
    if (rfqs.length > 0) {
      // Select all rfq line items
      const [items] = await db.query('SELECT * FROM rfq_items');
      
      // Map line items to their parent RFQ
      rfqs.forEach(rfq => {
        rfq.line_items = items.filter(item => item.rfq_id === rfq.id);
      });
    }

    res.json(rfqs);
  } catch (error) {
    console.error('Fetch RFQs Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching RFQs.', error: error.message });
  }
};
