import db from '../config/db.js';
import { logActivity } from '../utils/logger.js';

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
  const { quotation_id, approval_remarks } = req.body;

  try {
    if (!quotation_id) {
      return res.status(400).json({ message: 'Quotation ID is required.' });
    }

    // 1. Check if PO already exists
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

    // 4. Calculate Tax and Total (pricing_details is already the grand total of the quote)
    const totalCalculation = parseFloat(quote.pricing_details);
    const taxRate = parseFloat(quote.tax_gst_percent || 18.00) / 100;
    const subtotal = totalCalculation / (1 + taxRate);
    const taxCalculation = parseFloat((totalCalculation - subtotal).toFixed(2));

    const poNumber = generatePONumber();

    // 5. Insert PO (Step 1 of approval stepper workflow: Draft, L1 Review Pending)
    const [result] = await db.query(
      'INSERT INTO purchase_orders (po_number, quotation_id, tax_calculation, total_calculation, approval_remarks, l1_status, l2_status) VALUES (?, ?, ?, ?, ?, "Pending", "Pending")',
      [poNumber, quotation_id, taxCalculation, totalCalculation, approval_remarks || 'Workflow initiated.']
    );

    const poId = result.insertId;

    await logActivity(
      req.user.id,
      'Generate Purchase Order',
      `PO #${poNumber} initiated for L1/L2 approval (Total: $${totalCalculation})`
    );

    res.status(201).json({
      message: 'Purchase Order initiated successfully.',
      po: {
        id: poId,
        po_number: poNumber,
        quotation_id,
        tax_calculation: taxCalculation,
        total_calculation: totalCalculation,
        status: 'Draft'
      }
    });

  } catch (error) {
    console.error('Create PO Error:', error.message);
    res.status(500).json({ message: 'Server error while generating Purchase Order.', error: error.message });
  }
};

// @desc    Get detailed Purchase Order with line items
// @route   GET /api/po/:id
// @access  Private
export const getPurchaseOrderDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const [pos] = await db.query(`
      SELECT 
        po.id AS po_id,
        po.po_number,
        po.tax_calculation,
        po.total_calculation,
        po.status AS po_status,
        po.approval_remarks,
        po.approval_date,
        po.l1_status,
        po.l1_approver,
        po.l1_date,
        po.l1_remarks,
        po.l2_status,
        po.l2_approver,
        po.l2_date,
        po.l2_remarks,
        po.created_at AS po_date,
        q.id AS quotation_id,
        q.pricing_details AS subtotal,
        q.delivery_timeline,
        q.notes AS vendor_notes,
        q.tax_gst_percent,
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

    const po = pos[0];

    // Fetch line items
    const [items] = await db.query(`
      SELECT qi.*, ri.item_name, ri.quantity AS rfq_quantity, ri.unit
      FROM quotation_items qi
      JOIN rfq_items ri ON qi.rfq_item_id = ri.id
      WHERE qi.quotation_id = ?
    `, [po.quotation_id]);

    po.line_items = items;

    res.json(po);
  } catch (error) {
    console.error('Get PO Details Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching Purchase Order details.', error: error.message });
  }
};

// @desc    L1 Approval (Rahul Mehta)
// @route   PUT /api/po/:id/l1-approve
// @access  Private (Procurement Head / Admin)
export const approveL1 = async (req, res) => {
  const { id } = req.params;
  const { remarks } = req.body;

  try {
    const [pos] = await db.query('SELECT po_number FROM purchase_orders WHERE id = ?', [id]);
    if (pos.length === 0) {
      return res.status(404).json({ message: 'Purchase Order not found.' });
    }

    await db.query(
      'UPDATE purchase_orders SET l1_status = "Approved", l1_date = NOW(), l1_remarks = ? WHERE id = ?',
      [remarks || 'Approved by Procurement Head.', id]
    );

    await logActivity(
      req.user.id,
      'L1 Approval',
      `PO #${pos[0].po_number} L1 approved by ${req.user.name}`
    );

    res.json({ message: 'L1 approval recorded successfully.', po_id: id });
  } catch (error) {
    console.error('L1 Approval Error:', error.message);
    res.status(500).json({ message: 'Server error during L1 approval.', error: error.message });
  }
};

// @desc    L2 Approval (Priya Shah)
// @route   PUT /api/po/:id/l2-approve
// @access  Private (Finance Manager / Admin)
export const approveL2 = async (req, res) => {
  const { id } = req.params;
  const { remarks } = req.body;

  try {
    const [pos] = await db.query('SELECT po_number FROM purchase_orders WHERE id = ?', [id]);
    if (pos.length === 0) {
      return res.status(404).json({ message: 'Purchase Order not found.' });
    }

    // L2 Approval closes the chain and marks PO status to Active / Approved
    await db.query(
      'UPDATE purchase_orders SET l2_status = "Approved", l2_date = NOW(), l2_remarks = ?, status = "Received" WHERE id = ?',
      [remarks || 'Approved by Finance Manager.', id]
    );

    await logActivity(
      req.user.id,
      'L2 Approval',
      `PO #${pos[0].po_number} L2 approved (workflow complete) by ${req.user.name}`
    );

    res.json({ message: 'L2 approval complete. Purchase Order generated.', po_id: id });
  } catch (error) {
    console.error('L2 Approval Error:', error.message);
    res.status(500).json({ message: 'Server error during L2 approval.', error: error.message });
  }
};

// @desc    Reject PO
// @route   PUT /api/po/:id/reject
// @access  Private (Procurement Head / Finance Manager / Admin)
export const rejectPO = async (req, res) => {
  const { id } = req.params;
  const { remarks, stage } = req.body; // stage: 'l1' or 'l2'

  try {
    const [pos] = await db.query('SELECT po_number FROM purchase_orders WHERE id = ?', [id]);
    if (pos.length === 0) {
      return res.status(404).json({ message: 'Purchase Order not found.' });
    }

    if (stage === 'l1') {
      await db.query(
        'UPDATE purchase_orders SET l1_status = "Rejected", l1_date = NOW(), l1_remarks = ? WHERE id = ?',
        [remarks || 'Rejected at L1.', id]
      );
    } else {
      await db.query(
        'UPDATE purchase_orders SET l2_status = "Rejected", l2_date = NOW(), l2_remarks = ? WHERE id = ?',
        [remarks || 'Rejected at L2.', id]
      );
    }

    await logActivity(
      req.user.id,
      'Reject PO',
      `PO #${pos[0].po_number} rejected at ${stage === 'l1' ? 'L1' : 'L2'} stage.`
    );

    res.json({ message: `PO rejected at ${stage === 'l1' ? 'L1' : 'L2'} successfully.`, po_id: id });
  } catch (error) {
    console.error('Reject PO Error:', error.message);
    res.status(500).json({ message: 'Server error during PO rejection.', error: error.message });
  }
};

// @desc    Update Status
export const updatePOStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const validStatuses = ['Draft', 'Sent', 'Received', 'Paid'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid PO status.' });
    }

    const [pos] = await db.query('SELECT po_number FROM purchase_orders WHERE id = ?', [id]);
    if (pos.length === 0) {
      return res.status(404).json({ message: 'Purchase Order not found.' });
    }

    await db.query('UPDATE purchase_orders SET status = ? WHERE id = ?', [status, id]);

    await logActivity(
      req.user.id,
      'Update PO Status',
      `Status of PO #${pos[0].po_number} updated to ${status}`
    );

    res.json({ message: `PO status updated to ${status} successfully.`, po_id: id, status });
  } catch (error) {
    console.error('Update PO Status Error:', error.message);
    res.status(500).json({ message: 'Server error while updating PO status.', error: error.message });
  }
};

// @desc    Simulate emailing
export const sendPOEmailSimulation = async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: 'Recipient email address is required.' });
    }

    const [pos] = await db.query('SELECT po_number, total_calculation FROM purchase_orders WHERE id = ?', [id]);
    if (pos.length === 0) {
      return res.status(404).json({ message: 'Purchase Order not found.' });
    }

    const po = pos[0];

    await db.query('UPDATE purchase_orders SET status = "Sent" WHERE id = ? AND status = "Draft"', [id]);

    await logActivity(
      req.user.id,
      'Email Invoice PO',
      `Emailed Purchase Order #${po.po_number} (Total: $${po.total_calculation}) to ${email}`
    );

    res.json({
      message: `Simulated Email Sent Successfully!`,
      deliveryDetails: {
        to: email,
        subject: `Purchase Order #${po.po_number} from VendorBridge`,
        status: 'Delivered',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Email Simulation Error:', error.message);
    res.status(500).json({ message: 'Server error during email simulation.', error: error.message });
  }
};

// @desc    Get all purchase orders
// @route   GET /api/po
// @access  Private
export const getPurchaseOrders = async (req, res) => {
  try {
    const [pos] = await db.query(`
      SELECT 
        po.id,
        po.id AS po_id,
        po.po_number,
        po.total_calculation,
        po.status,
        po.status AS po_status,
        po.l1_status,
        po.l2_status,
        po.created_at,
        po.created_at AS po_date,
        vendor.name AS vendor_name
      FROM purchase_orders po
      JOIN quotations q ON po.quotation_id = q.id
      JOIN users vendor ON q.vendor_id = vendor.id
      ORDER BY po.created_at DESC
    `);
    res.json(pos);
  } catch (error) {
    console.error('Get POs Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching POs.', error: error.message });
  }
};
