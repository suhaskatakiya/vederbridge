import db from '../config/db.js';

// Helper to generate a unique PO number
const generatePONumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `PO-${dateStr}-${randomSuffix}`;
};

// @desc    Auto-generate a Purchase Order based on the approved quote
// @route   POST /api/po
// @access  Private (Procurement Officer / Manager / Admin)
export const createPurchaseOrder = async (req, res) => {
  const { quotation_id } = req.body;

  try {
    if (!quotation_id) {
      return res.status(400).json({ message: 'Quotation ID is required.' });
    }

    // 1. Check if PO already exists for this quotation
    const [existingPOs] = await db.query('SELECT * FROM purchase_orders WHERE quotation_id = ?', [quotation_id]);
    if (existingPOs.length > 0) {
      return res.status(200).json({
        message: 'Purchase Order already generated for this quotation.',
        po: existingPOs[0]
      });
    }

    // 2. Fetch quotation details
    const [quotes] = await db.query('SELECT * FROM quotations WHERE id = ?', [quotation_id]);
    if (quotes.length === 0) {
      return res.status(404).json({ message: 'Quotation not found.' });
    }

    const quote = quotes[0];

    // 3. Ensure quotation status is approved
    if (quote.status !== 'Approved') {
      return res.status(400).json({ message: 'Cannot generate a Purchase Order for a quotation that is not approved.' });
    }

    // 4. Calculate Tax and Total
    const subtotal = parseFloat(quote.pricing_details);
    const taxRate = 0.10; // 10%
    const taxCalculation = parseFloat((subtotal * taxRate).toFixed(2));
    const totalCalculation = parseFloat((subtotal + taxCalculation).toFixed(2));

    const poNumber = generatePONumber();

    // 5. Insert PO
    const [result] = await db.query(
      'INSERT INTO purchase_orders (po_number, quotation_id, tax_calculation, total_calculation) VALUES (?, ?, ?, ?)',
      [poNumber, quotation_id, taxCalculation, totalCalculation]
    );

    res.status(201).json({
      message: 'Purchase Order generated successfully.',
      po: {
        id: result.insertId,
        po_number: poNumber,
        quotation_id,
        tax_calculation: taxCalculation,
        total_calculation: totalCalculation
      }
    });

  } catch (error) {
    console.error('Create PO Error:', error.message);
    res.status(500).json({ message: 'Server error while generating Purchase Order.', error: error.message });
  }
};

// @desc    Get detailed Purchase Order by PO ID or Quotation ID
// @route   GET /api/po/:id
// @access  Private
export const getPurchaseOrderDetails = async (req, res) => {
  const { id } = req.params;

  try {
    // We can query by PO ID. Let's join PO, quotation, RFQ, and users (Vendor and Creator)
    const [pos] = await db.query(`
      SELECT 
        po.id AS po_id,
        po.po_number,
        po.tax_calculation,
        po.total_calculation,
        po.created_at AS po_date,
        q.id AS quotation_id,
        q.pricing_details AS subtotal,
        q.delivery_timeline,
        r.id AS rfq_id,
        r.title AS rfq_title,
        r.product_details AS rfq_details,
        r.quantity AS rfq_quantity,
        vendor.name AS vendor_name,
        vendor.email AS vendor_email,
        buyer.name AS buyer_name,
        buyer.email AS buyer_email
      FROM purchase_orders po
      JOIN quotations q ON po.quotation_id = q.id
      JOIN rfqs r ON q.rfq_id = r.id
      JOIN users vendor ON q.vendor_id = vendor.id
      LEFT JOIN users buyer ON r.created_by = buyer.id
      WHERE po.id = ? OR po.quotation_id = ?
    `, [id, id]);

    if (pos.length === 0) {
      return res.status(404).json({ message: 'Purchase Order not found.' });
    }

    res.json(pos[0]);
  } catch (error) {
    console.error('Get PO Details Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching Purchase Order details.', error: error.message });
  }
};
