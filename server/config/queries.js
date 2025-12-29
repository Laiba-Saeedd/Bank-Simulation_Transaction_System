// config/queries.js
import db from "./db.js";

// Get active users with role 'user'
export const getActiveUsers = (callback) => {
  db.query(
    "SELECT user_id, name, contact, status, role FROM users WHERE status='active' AND role='user'",
    (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    }
  );
};

// Get single user by ID
export const getUserById = (id, callback) => {
  db.query(
    "SELECT user_id, name, contact, status, role FROM users WHERE user_id=?",
    [id],
    (err, results) => {
      if (err) return callback(err);
      callback(null, results[0]);
    }
  );
};

// Insert / Update statement log
export const logStatement = (userId, status, callback) => {
  const period = new Date().toISOString().slice(0, 7); // YYYY-MM
  db.query(
    `INSERT INTO statement_logs (user_id, period, status, sent_at)
     VALUES (?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE status = VALUES(status), sent_at = NOW()`,
    [userId, period, status],
    (err, result) => {
      if (callback) callback(err, result);
    }
  );
};
export const getLatestStatementLog = (userId, callback) => {
  db.query(
    `SELECT * FROM statement_logs
     WHERE user_id = ?
     ORDER BY sent_at DESC
     LIMIT 1`,
    [userId],
    (err, results) => {
      if (err) return callback(err);
      callback(null, results[0] || null); // Return null if no log exists
    }
  );
};

/* ===========================
   PROMISIFIED VERSIONS
=========================== */

export const getActiveUsersAsync = () => {
  return new Promise((resolve, reject) => {
    getActiveUsers((err, users) => (err ? reject(err) : resolve(users)));
  });
};

export const getUserByIdAsync = (userId) => {
  return new Promise((resolve, reject) => {
    getUserById(userId, (err, user) => (err ? reject(err) : resolve(user)));
  });
};

export const logStatementAsync = (userId, status) => {
  return new Promise((resolve, reject) => {
    logStatement(userId, status, (err) => (err ? reject(err) : resolve()));
  });
};
