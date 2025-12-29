// models/Account.js
import db from "../config/db.js";
import { sendEmail } from "../services/emailService.js";

const Account = {
// Create a new account
create: (accountData) => {
    return new Promise((resolve, reject) => {
      // Step 1: Check if user exists and is not blocked
      const checkUserSql = `SELECT * FROM users WHERE user_id = ?`;
      db.query(checkUserSql, [accountData.user_id], (err, userResult) => {
        if (err) return reject(err);
        if (!userResult.length) return reject(new Error("User not found"));

        const user = userResult[0];
        if (user.status === "blocked" || user.is_blocked) {
          return reject(new Error("Cannot create account: user is blocked"));
        }

        // Step 2: Insert account
        const sql = `
          INSERT INTO accounts (user_id, account_number, balance, account_type, created_at)
          VALUES (?, ?, ?, ?, NOW())
        `;

        db.query(
          sql,
          [
            accountData.user_id,
            accountData.account_number,
            accountData.balance,
            accountData.account_type || "Saving",
          ],
          async (err, result) => {
            if (err) return reject(err);

            // Step 3: Send welcome email
            if (user.contact?.includes("@")) {
              const accountInfo = {
                account_number: accountData.account_number,
                balance: accountData.balance,
                account_type: accountData.account_type || "Saving",
              };

              try {
                await sendEmail({
                  to: user.contact,
                  subject: "Welcome to HBL Bank!",
                  html: welcomeEmailTemplate(user, accountInfo),
                });
              } catch (emailErr) {
                console.error("Error sending welcome email:", emailErr);
                // We don't reject here; account creation succeeded even if email fails
              }
            }

            // Step 4: Resolve with account info + user info
            resolve({
              ...result,
              user: {
                name: user.name,
                contact: user.contact,
                user_id: user.user_id,
              },
              account: {
                account_number: accountData.account_number,
                balance: accountData.balance,
                account_type: accountData.account_type || "Saving",
               },
          });
        } 
      );
    });
  });
},

  // Find account by ID
  findById: (id) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM accounts WHERE id = ?";
    db.query(sql, [id], (err, results) => {
      if (err) return reject(err);
      resolve(results[0] || null); // <--- returns null if not found
    });
  });
},

  // Find all accounts
  findAll: () => {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM accounts ORDER BY created_at DESC";
      db.query(sql, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  },
  // Find accounts by User ID
  findByUserId: (user_id) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM accounts WHERE user_id = ?";
    db.query(sql, [user_id], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
},
  // Find account with user info
findWithUser: (accountNumber) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT a.id, a.user_id, a.account_number, a.balance, a.account_type, u.name AS holder_name
      FROM accounts a
      JOIN users u ON a.user_id = u.user_id
      WHERE a.account_number = ?`;  // use account_number now
    db.query(sql, [accountNumber], (err, results) => {
      if (err) return reject(err);
      resolve(results[0]); // single account with user info
    });
  });
},

  // Update account by ID
  updateById: (id, data) => {
    return new Promise((resolve, reject) => {
      const fields = [];
      const values = [];

      if (data.account_number !== undefined) {
        fields.push("account_number = ?");
        values.push(data.account_number);
      }
      if (data.balance !== undefined) {
        fields.push("balance = ?");
        values.push(data.balance);
      }
       if (data.account_type !== undefined) {
        fields.push("account_type = ?");
        values.push(data.account_type);
      }

      if (fields.length === 0) return resolve(null); // nothing to update

      const sql = `UPDATE accounts SET ${fields.join(", ")} WHERE id = ?`;
      values.push(id);

      db.query(sql, values, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  },
    // Find account by ID
  findById: (id) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM accounts WHERE id = ?";
    db.query(sql, [id], (err, results) => {
      if (err) return reject(err);
      resolve(results[0] || null); // <--- returns null if not found
    });
  });
},

  // Find all accounts
  findAll: () => {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM accounts ORDER BY created_at DESC";
      db.query(sql, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  },

  // Find accounts by User ID
  findByUserId: (user_id) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM accounts WHERE user_id = ?";
    db.query(sql, [user_id], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
},

  // Update account by ID
  updateById: (id, data) => {
    return new Promise((resolve, reject) => {
      const fields = [];
      const values = [];

      if (data.account_number !== undefined) {
        fields.push("account_number = ?");
        values.push(data.account_number);
      }
      if (data.balance !== undefined) {
        fields.push("balance = ?");
        values.push(data.balance);
      }

      if (fields.length === 0) return resolve(null); // nothing to update

      const sql = `UPDATE accounts SET ${fields.join(", ")} WHERE id = ?`;
      values.push(id);

      db.query(sql, values, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  },
 // Update account by user ID + account ID
  updateByUserId: (user_id, account_id, data) => {
    return new Promise((resolve, reject) => {
      const fields = [];
      const values = [];

      if (data.account_number !== undefined) {
        fields.push("account_number = ?");
        values.push(data.account_number);
      }
      if (data.balance !== undefined) {
        fields.push("balance = ?");
        values.push(data.balance);
      }
if (data.account_type !== undefined) {
        fields.push("account_type = ?");
        values.push(data.account_type);
      }
      if (fields.length === 0) return resolve(null); // nothing to update

      const sql = `UPDATE accounts SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`;
      values.push(account_id, user_id);

      db.query(sql, values, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  },

// Delete account by ID (and all related transactions)
deleteById: (id) => {
  return new Promise((resolve, reject) => {
    const deleteTransactionsSql = `
      DELETE FROM transactions
      WHERE account_id = ? OR target_account_id = ?
    `;

    db.query(deleteTransactionsSql, [id, id], (err) => {
      if (err) return reject(err);

      db.query("DELETE FROM accounts WHERE id = ?", [id], (err2, result) => {
        if (err2) return reject(err2);
        resolve(result);
      });
    });
  });
},
findByAccountNumber: (account_number) => {
  return new Promise((resolve, reject) => {
    if (!account_number) return reject(new Error("account_number missing"));
    const sql = "SELECT * FROM accounts WHERE account_number = ?";
    db.query(sql, [account_number], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
},

// Delete all accounts for a user (and their transactions)
deleteByUserId: (user_id) => {
  return new Promise((resolve, reject) => {
    db.query("SELECT id FROM accounts WHERE user_id = ?", [user_id], (err, accounts) => {
      if (err) return reject(err);

      const accountIds = accounts.map(a => a.id);
      if (accountIds.length === 0) return resolve({ affectedRows: 0 });

      const placeholders = accountIds.map(() => "?").join(",");

      const deleteTransactionsSql = `
        DELETE FROM transactions
        WHERE account_id IN (${placeholders}) OR target_account_id IN (${placeholders})
      `;

      db.query(deleteTransactionsSql, [...accountIds, ...accountIds], (err2) => {
        if (err2) return reject(err2);

        db.query(`DELETE FROM accounts WHERE id IN (${placeholders})`, accountIds, (err3, result) => {
          if (err3) return reject(err3);
          resolve(result);
        });
      });
    });
  });
},
};



export default Account;
