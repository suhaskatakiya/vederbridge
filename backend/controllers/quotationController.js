import db from '../config/db.js';
import { logActivity } from '../utils/logger.js';

// @desc    Submit a quote for an RFQ (Screen 6)
// @route   POST /api/quotations
// @access  Private (Vendor / Admin)
export const submitQuotation = async (req, res) => {
  const { rfq_id, tax_gst_percent, notes, line_items } = req.body;

  // line_items should be an array of { rfq_item_id, unit_price, delivery_days }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    if (!rfq_id || !line_items || !Array.isArray(line_items) || line_items.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'RFQ ID and line item pricing are required.' });
    }

    // Check if vendor profile is active/approved
    const [profiles] = await connection.query('SELECT status FROM vendor_profiles WHERE user_id = ?', [req.user.id]);
    if (profiles.length > 0 && profiles[0].status !== 'Active') {
      await connection.rollback();
      return res.status(403).json({ 
        message: `Your vendor account status is '${profiles[0].status}'. You can only submit quotes once your account is 'Active' (Approved by Admin).` 
      });
    }

    // Check if RFQ exists and is open
    const [rfqs] = await connection.query('SELECT title, status, deadline FROM rfqs WHERE id = ?', [rfq_id]);
    if (rfqs.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'RFQ not found.' });
    }

    const rfq = rfqs[0];
    if (rfq.status !== 'Open') {
      await connection.rollback();
      return res.status(400).json({ message: 'This RFQ is already closed.' });
    }

    // Calculate subtotal and grand total dynamically
    let subtotal = 0;
    let maxDeliveryDays = 0;
    const computedItems = [];

    // Fetch the rfq_items for verification
    const [rfqItems] = await connection.query('SELECT id, quantity FROM rfq_items WHERE rfq_id = ?', [rfq_id]);

    for (const item of line_items) {
      const rfqItem = rfqItems.find(ri => ri.id === parseInt(item.rfq_item_id));
      if (!rfqItem) {
        throw new Error(`Invalid RFQ item ID: ${item.rfq_item_id}`);
      }

      const qty = rfqItem.quantity;
      const uPrice = parseFloat(item.unit_price || 0);
      const itemTotal = qty * uPrice;
      const delDays = parseInt(item.delivery_days || 1);

      subtotal += itemTotal;
      if (delDays > maxDeliveryDays) {
        maxDeliveryDays = delDays;
      }

      computedItems.push({
        rfq_item_id: item.rfq_item_id,
        unit_price: uPrice,
        total_price: itemTotal,
        delivery_days: delDays
      });
    }

    const gstRate = parseFloat(tax_gst_percent || 18.00) / 100;
    const gstCalc = parseFloat((subtotal * gstRate).toFixed(2));
    const grandTotal = parseFloat((subtotal + gstCalc).toFixed(2));

    // Check if quote already exists
    const [existing] = await connection.query('SELECT id FROM quotations WHERE rfq_id = ? AND vendor_id = ?', [rfq_id, req.user.id]);
    
    let quotationId;
    if (existing.length > 0) {
      // Overwrite / Update
      quotationId = existing[0].id;
      await connection.query(
        'UPDATE quotations SET pricing_details = ?, delivery_timeline = ?, notes = ?, tax_gst_percent = ? WHERE id = ?',
        [grandTotal, `${maxDeliveryDays} days`, notes || null, tax_gst_percent || 18.00, quotationId]
      );
      // Clean up previous items
      await connection.query('DELETE FROM quotation_items WHERE quotation_id = ?', [quotationId]);
    } else {
      // Insert new
      const [quoteResult] = await connection.query(
        'INSERT INTO quotations (rfq_id, vendor_id, pricing_details, delivery_timeline, notes, tax_gst_percent) VALUES (?, ?, ?, ?, ?, ?)',
        [rfq_id, req.user.id, grandTotal, `${maxDeliveryDays} days`, notes || null, tax_gst_percent || 18.00]
      );
      quotationId = quoteResult.insertId;
    }

    // Insert quote line items
    for (const item of computedItems) {
      await connection.query(
        'INSERT INTO quotation_items (quotation_id, rfq_item_id, unit_price, total_price, delivery_days) VALUES (?, ?, ?, ?, ?)',
        [quotationId, item.rfq_item_id, item.unit_price, item.total_price, item.delivery_days]
      );
    }

    await connection.commit();

    await logActivity(
      req.user.id,
      'Submit Quotation',
      `Submitted detailed bid (Grand Total: $${grandTotal}, GST: ${tax_gst_percent}%) on RFQ: "${rfq.title}"`
    );

    res.status(201).json({
      message: 'Quotation submitted successfully with line item calculations.',
      quotation_id: quotationId,
      grand_total: grandTotal
    });

  } catch (error) {
    await connection.rollback();
    console.error('Submit Quotation Error:', error.message);
    res.status(500).json({ message: error.message || 'Server error while submitting quotation.', error: error.message });
  } finally {
    connection.release();
  }
};

// @desc    Edit/Update an existing quotation
// @route   PUT /api/quotations/:id
// @access  Private (Vendor)
export const updateQuotation = async (req, res) => {
  // Re-route to submitQuotation since it handles updates automatically if existing bid exists!
  // To keep route mappings clean, we implement standard PUT wrapper:
  const { rfq_id, tax_gst_percent, notes, line_items } = req.body;
  req.body.rfq_id = rfq_id || req.body.rfq_id; // map parameters
  return submitQuotation(req, res);
};

// @desc    Get all quotes for a specific RFQ with detailed line items
// @route   GET /api/quotations/:rfq_id
// @access  Private (Procurement Officer / Manager / Admin)
export const getQuotationsByRFQ = async (req, res) => {
  const { rfq_id } = req.params;

  try {
    const [quotes] = await db.query(`
      SELECT 
        q.*, 
        u.name AS vendor_name, 
        u.email AS vendor_email,
        vp.company_name,
        vp.rating AS vendor_rating,
        vp.category AS vendor_category,
        vp.gst_number AS vendor_gst
      FROM quotations q
      LEFT JOIN users u ON q.vendor_id = u.id
      LEFT JOIN vendor_profiles vp ON u.id = vp.user_id
      WHERE q.rfq_id = ?
      ORDER BY q.pricing_details ASC
    `, [rfq_id]);

    if (quotes.length > 0) {
      // Fetch all quotation items joined with rfq item names
      const [items] = await db.query(`
        SELECT qi.*, ri.item_name, ri.quantity AS rfq_quantity, ri.unit
        FROM quotation_items qi
        JOIN rfq_items ri ON qi.rfq_item_id = ri.id
      `);

      quotes.forEach(quote => {
        quote.line_items = items.filter(item => item.quotation_id === quote.id);
      });
    }

    res.json(quotes);
  } catch (error) {
    console.error('Get Quotations Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching quotations.', error: error.message });
  }
};

// @desc    Approve a quotation
// @route   PUT /api/quotations/approve/:id
// @access  Private (Procurement Officer / Manager / Admin)
export const approveQuotation = async (req, res) => {
  const { id } = req.params;
  const { approval_remarks } = req.body;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [quotes] = await connection.query('SELECT q.*, r.title FROM quotations q JOIN rfqs r ON q.rfq_id = r.id WHERE q.id = ?', [id]);
    if (quotes.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Quotation not found.' });
    }

    const quote = quotes[0];

    // Approve quotation
    await connection.query('UPDATE quotations SET status = "Approved" WHERE id = ?', [id]);
    await connection.query('UPDATE quotations SET status = "Rejected" WHERE rfq_id = ? AND id != ?', [quote.rfq_id, id]);
    await connection.query('UPDATE rfqs SET status = "Closed" WHERE id = ?', [quote.rfq_id]);

    await connection.commit();

    await logActivity(
      req.user.id,
      'Approve Quotation',
      `Approved bid ID ${id} for RFQ "${quote.title}". Remarks: ${approval_remarks || 'Initiated L1 approval workflow.'}`
    );

    res.json({ message: 'Quotation approved. RFQ closed.', quotation_id: id });
  } catch (error) {
    await connection.rollback();
    console.error('Approve Quotation Error:', error.message);
    res.status(500).json({ message: 'Server error while approving quotation.', error: error.message });
  } finally {
    connection.release();
  }
};

// @desc    Get all quotes submitted by the current logged-in vendor
// @route   GET /api/quotations/my-bids
// @access  Private (Vendor)
export const getMyQuotations = async (req, res) => {
  try {
    const [quotes] = await db.query(`
      SELECT q.*, r.title AS rfq_title, r.status AS rfq_status, r.deadline AS rfq_deadline 
      FROM quotations q 
      JOIN rfqs r ON q.rfq_id = r.id 
      WHERE q.vendor_id = ? 
      ORDER BY q.created_at DESC
    `, [req.user.id]);

    if (quotes.length > 0) {
      const [items] = await db.query(`
        SELECT qi.*, ri.item_name, ri.quantity AS rfq_quantity, ri.unit
        FROM quotation_items qi
        JOIN rfq_items ri ON qi.rfq_item_id = ri.id
      `);
      quotes.forEach(quote => {
        quote.line_items = items.filter(item => item.quotation_id === quote.id);
      });
    }

    res.json(quotes);
  } catch (error) {
    console.error('Get My Quotations Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching your quotations.', error: error.message });
  }
};
