import db from '../config/db.js';

/**
 * Logs an activity into the database for audit tracking
 * @param {number|null} userId - The ID of the user performing the action
 * @param {string} action - Brief title of the action (e.g. "Create RFQ")
 * @param {string} details - Detailed notes of the action
 */
export const logActivity = async (userId, action, details) => {
  try {
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [userId, action, details]
    );
    console.log(`[Activity Logged] User ID ${userId || 'System'}: ${action} - ${details}`);
  } catch (err) {
    console.error('Failed to log activity to database:', err.message);
  }
};
