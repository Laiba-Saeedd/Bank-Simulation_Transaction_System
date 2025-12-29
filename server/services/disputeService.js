import  db  from "../config/db.js";
import { sendEmail } from "./emailService.js";
import  reverseTransaction  from "./reverseTransaction.js";
import  User from "../models/User.js";

export const raiseDispute = async (userId, transactionId, reason) => {
  // Insert dispute
  await new Promise((resolve, reject) => {
    const query = `
      INSERT INTO disputes (transaction_id, user_id, reason, status, created_at)
      VALUES (?, ?, ?, 'pending', NOW())
    `;
    db.query(query, [transactionId, userId, reason], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });

  // Notify user
  const user = await User.findById(userId);
  await sendEmail({
    to: user.contact,
    subject: "Dispute Raised",
    html: `<p>Your dispute for ${reason} has been raised.</p>`
  });
};

const getDispute = async (disputeId) => {
  if (!disputeId || isNaN(disputeId)) {
    throw new Error("Invalid dispute ID");
  }

  const [rows] = await db.promise().query(
    "SELECT * FROM disputes WHERE id = ?",
    [disputeId]
  );

  return rows.length ? rows[0] : null;
};

export const reviewDispute = async (disputeId, approve = true) => {
  const dispute = await getDispute(disputeId);

  if (!dispute) throw new Error("Dispute not found");

  // ❗ safety: already reviewed?
  if (dispute.status !== "pending") {
    throw new Error("Dispute already reviewed");
  }

  if (approve) {
    // 1️⃣ reverse transaction FIRST
    await reverseTransaction(dispute.transaction_id);
  }

  // 2️⃣ update dispute status
  const status = approve ? "approved" : "rejected";
  await db.promise().query(
    "UPDATE disputes SET status=?, updated_at=NOW() WHERE id=?",
    [status, disputeId]
  );

  // 3️⃣ notify user
  const user = await User.findById(dispute.user_id);
  if (user?.contact) {
    await sendEmail({
      to: user.contact,
      subject: `Dispute ${status}`,
      html: `<p>Your dispute for ${dispute.reason} has been <b>${status}</b>.</p>`,
    });
  }
};
export const getAllDisputes = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        d.id, 
        d.user_id, 
        d.transaction_id, 
        d.reason, 
        d.status,
        d.created_at AS dispute_date,
        t.account_id AS account_id, 
        t.type AS account_type, 
        t.amount AS account_amount,
        t.date AS transaction_date
      FROM disputes d
      LEFT JOIN transactions t ON d.transaction_id = t.transaction_id
      ORDER BY d.id DESC
    `;

    if (!db) return reject(new Error("Database connection not initialized"));

    db.query(query, (err, results) => {
      if (err) return reject(err);

      const disputes = results.map(r => ({
        id: r.id,
        user_id: r.user_id,
        transaction_id: r.transaction_id,
        reason: r.reason,
        status: r.status,
        dispute_date: r.dispute_date,
        account: {
          id: r.account_id,
          type: r.account_type,
          amount: r.account_amount,
          transaction_date: r.transaction_date,
        }
      }));

      resolve(disputes);
    });
  });
};
export const fetchActiveDisputesByAccount = (accountId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT d.transaction_id
      FROM disputes d
      JOIN transactions t ON t.transaction_id = d.transaction_id
      WHERE t.account_id = ?
        AND d.status IN ('pending', 'approved')
    `;

    db.query(query, [accountId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows.map(r => r.transaction_id));
    });
  });
};