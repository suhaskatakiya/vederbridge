import db from '../config/db.js';

// @desc    Get all audit activity logs
// @route   GET /api/activity-logs
// @access  Private (Admin / Manager / Procurement)
export const getActivityLogs = async (req, res) => {
  try {
    const [logs] = await db.query(`
      SELECT al.*, u.name AS user_name, u.email AS user_email, u.role AS user_role
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 100
    `);
    
    res.json(logs);
  } catch (error) {
    console.error('Fetch Activity Logs Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching activity logs.', error: error.message });
  }
};
