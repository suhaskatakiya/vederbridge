import db from '../config/db.js';

// @desc    Submit a quote for an RFQ
// @route   POST /api/quotations
// @access  Private (Vendor / Admin)
export const submitQuotation = async (req, res) => {
  const { rfq_id, pricing_details, delivery_timeline } = req.body;

  try {
    if (!rfq_id || !pricing_details || !delivery_timeline) {
      return res.status(400).json({ message: 'All fields (rfq_id, pricing_details, delivery_timeline) are required.' });
    }

    if (isNaN(pricing_details) || parseFloat(pricing_details) <= 0) {
      return res.status(400).json({ message: 'Pricing details must be a positive number.' });
    }

    // Ensure user is Vendor or Admin
    if (req.user.role !== 'Vendor' && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only Vendors can submit quotations.' });
    }

    // Check if RFQ exists and is open
    const [rfqs] = await db.query('SELECT id, status, deadline FROM rfqs WHERE id = ?', [rfq_id]);
    if (rfqs.length === 0) {
      return res.status(404).json({ message: 'RFQ not found.' });
    }

    const rfq = rfqs[0];
    if (rfq.status !== 'Open') {
      return res.status(400).json({ message: 'This RFQ is already closed.' });
    }

    // Check if vendor already submitted a quote for this RFQ
    const [existingQuotes] = await db.query(
      'SELECT id FROM quotations WHERE rfq_id = ? AND vendor_id = ?',
      [rfq_id, req.user.id]
    );

    if (existingQuotes.length > 0) {
      return res.status(400).json({ message: 'You have already submitted a quote for this RFQ.' });
    }

    // Save quotation
    const [result] = await db.query(
      'INSERT INTO quotations (rfq_id, vendor_id, pricing_details, delivery_timeline) VALUES (?, ?, ?, ?)',
      [rfq_id, req.user.id, parseFloat(pricing_details), delivery_timeline]
    );

    res.status(201).json({
      message: 'Quotation submitted successfully',
      quotation: {
        id: result.insertId,
        rfq_id,
        vendor_id: req.user.id,
        pricing_details: parseFloat(pricing_details),
        delivery_timeline,
        status: 'Pending'
      }
    });

  } catch (error) {
    console.error('Submit Quotation Error:', error.message);
    res.status(500).json({ message: 'Server error while submitting quotation.', error: error.message });
  }
};

// @desc    Get all quotes for a specific RFQ
// @route   GET /api/quotations/:rfq_id
// @access  Private (Procurement Officer / Manager / Admin)
export const getQuotationsByRFQ = async (req, res) => {
  const { rfq_id } = req.params;

  try {
    const [quotes] = await db.query(`
      SELECT q.*, u.name AS vendor_name, u.email AS vendor_email
      FROM quotations q
      LEFT JOIN users u ON q.vendor_id = u.id
      WHERE q.rfq_id = ?
      ORDER BY q.pricing_details ASC
    `, [rfq_id]);

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

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Check if quotation exists
    const [quotes] = await connection.query('SELECT * FROM quotations WHERE id = ?', [id]);
    if (quotes.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Quotation not found.' });
    }

    const quote = quotes[0];

    if (quote.status === 'Approved') {
      await connection.rollback();
      return res.status(400).json({ message: 'This quotation is already approved.' });
    }

    // Approve the quote
    await connection.query('UPDATE quotations SET status = "Approved" WHERE id = ?', [id]);

    // Reject other quotes for the same RFQ
    await connection.query(
      'UPDATE quotations SET status = "Rejected" WHERE rfq_id = ? AND id != ?',
      [quote.rfq_id, id]
    );

    // Close the RFQ
    await connection.query('UPDATE rfqs SET status = "Closed" WHERE id = ?', [quote.rfq_id]);

    await connection.commit();
    res.json({ message: 'Quotation approved successfully, and RFQ closed.', quotation_id: id });
  } catch (error) {
    await connection.rollback();
    console.error('Approve Quotation Error:', error.message);
    res.status(500).json({ message: 'Server error while approving quotation.', error: error.message });
  } finally {
    connection.release();
  }
};
