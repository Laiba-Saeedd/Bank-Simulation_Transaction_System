// controllers/transactionController.js
import { depositAmount, withdrawAmount, transferAmount } from "../services/transactionService.js";
import db from "../config/db.js";
export const depositController = async (req, res) => {
  try {
    const { accountId, amount } = req.body;
    const result = await depositAmount(accountId, amount);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

export const withdrawController = async (req, res) => {
  try {
    const { accountId, amount } = req.body;
    const result = await withdrawAmount(accountId, amount);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

export const transferController = async (req, res) => {
  try {
    const { fromAccountId, toAccountNumber, amount } = req.body;
    const result = await transferAmount(fromAccountId, toAccountNumber, amount);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};
export const getTransactionHistory = (req, res) => {
  const { account_id } = req.params;

  if (!account_id) return res.status(400).json({ message: "Account ID required" });

  const query = `
    SELECT t.transaction_id, t.type, t.amount, t.target_account_id, t.date, a.account_number AS target_account_number
    FROM transactions t
    LEFT JOIN accounts a ON t.target_account_id = a.id
    WHERE t.account_id = ?
    ORDER BY t.date DESC
  `;

  db.query(query, [account_id], (err, result) => {
    if (err) return res.status(500).json({ message: "DB error", error: err.message });
    res.json(result);
  });
};
export const getTransactionsByAccount = (req, res) => {
  const accountId = req.params.accountId;

  if (!accountId) return res.status(400).json({ message: "Account ID required" });

  const query = `
    SELECT t.transaction_id, t.type, t.amount, t.target_account_id, t.date,
           a.account_number AS target_account_number
    FROM transactions t
    LEFT JOIN accounts a ON t.target_account_id = a.id
    WHERE t.account_id = ?
    ORDER BY t.date DESC
  `;

  db.query(query, [accountId], (err, result) => {
    if (err) return res.status(500).json({ message: "DB error", error: err.message });
    res.json(result);
  });
};

// Get transactions filtered by date (callback style)
export const getTransactionsByDate = (req, res) => {
  const accountId = req.params.accountId;
  const { fromDate, toDate } = req.query;

  if (!accountId || !fromDate || !toDate)
    return res.status(400).json({ message: "Account ID and date range required" });

  const query = `
    SELECT t.transaction_id, t.type, t.amount, t.target_account_id, t.date,
           a.account_number AS target_account_number
    FROM transactions t
    LEFT JOIN accounts a ON t.target_account_id = a.id
    WHERE t.account_id = ? AND DATE(t.date) BETWEEN ? AND ?
    ORDER BY t.date DESC
  `;

  db.query(query, [accountId, fromDate, toDate], (err, result) => {
    if (err) return res.status(500).json({ message: "DB error", error: err.message });
    res.json(result);
  });
};

