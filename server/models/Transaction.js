// models/Transaction.js
import db from "../config/db.js";

const Transaction = {
  // Fetch all transactions
  findAll: () => {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM transactions ORDER BY created_at DESC";
      db.query(sql, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  },

  // Deposit transaction
 deposit: ({ accountId, amount }) => {
  return new Promise((resolve, reject) => {
    if (!accountId || !amount || amount <= 0) {
      return reject({ message: "Invalid account or amount" });
    }

    // 1️⃣ Get account info (balance + user_id)
    const queryAccount = "SELECT balance, user_id FROM accounts WHERE id = ?";
    db.query(queryAccount, [accountId], (err, accountResult) => {
      if (err) return reject(err);
      if (!accountResult.length) return reject({ message: "Account not found" });

      const newBalance = Number(accountResult[0].balance) + Number(amount);
      const userId = accountResult[0].user_id;

      // 2️⃣ Get user contact/email
      const queryUser = "SELECT contact, name FROM users WHERE user_id = ?";
      db.query(queryUser, [userId], (err, userResult) => {
        if (err) return reject(err);
        const contact = userResult.length ? userResult[0].contact : null;
        const name = userResult.length ? userResult[0].name : null;
        // 3️⃣ Update account balance
        const updateQuery = "UPDATE accounts SET balance = ? WHERE id = ?";
        db.query(updateQuery, [newBalance, accountId], (err) => {
          if (err) return reject(err);

          // 4️⃣ Insert transaction record
          const insertTransaction = `
            INSERT INTO transactions (account_id, type, amount, description, date)
            VALUES (?, 'deposit', ?, 'Deposit', NOW())
          `;
          db.query(insertTransaction, [accountId, amount], (err) => {
            if (err) return reject(err);

            resolve({ message: "Deposit successful", balance: newBalance, contact, name });
          });
        });
      });
    });
  });
},

  // Withdraw transaction
 withdraw: ({ accountId, amount }) => {
  return new Promise((resolve, reject) => {
    if (!accountId || !amount || amount <= 0) 
      return reject({ message: "Invalid account or amount" });

    // 1️⃣ Get account info (balance + user_id)
    const queryAccount = "SELECT balance, user_id FROM accounts WHERE id = ?";
    db.query(queryAccount, [accountId], (err, accountResult) => {
      if (err) return reject(err);
      if (!accountResult.length) return reject({ message: "Account not found" });

      const currentBalance = Number(accountResult[0].balance);
      const userId = accountResult[0].user_id;

      if (amount > currentBalance) 
        return reject({ message: "Insufficient balance" });

      const newBalance = currentBalance - Number(amount);

      // 2️⃣ Get user contact/email
      const queryUser = "SELECT contact, name FROM users WHERE user_id = ?";
      db.query(queryUser, [userId], (err, userResult) => {
        if (err) return reject(err);
        const contact = userResult.length ? userResult[0].contact : null;
         const name = userResult.length ? userResult[0].name : null;
        // 3️⃣ Update account balance
        const updateQuery = "UPDATE accounts SET balance = ? WHERE id = ?";
        db.query(updateQuery, [newBalance, accountId], (err) => {
          if (err) return reject(err);

          // 4️⃣ Insert transaction record
          const insertTransaction = `
            INSERT INTO transactions (account_id, type, amount, description, date)
            VALUES (?, 'withdraw', ?, 'Withdraw cash', NOW())
          `;
          db.query(insertTransaction, [accountId, amount], (err) => {
            if (err) return reject(err);

            resolve({ message: "Withdrawal successful", balance: newBalance, contact, name });
          });
        });
      });
    });
  });
},

 // Fetch transactions by account ID (optional)
  findByAccountId: (accountId) => {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM transactions WHERE account_id = ? OR target_account_id = ?";
      db.query(sql, [accountId, accountId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  },

  // Delete transactions for a given account (used when deleting accounts)
deleteByAccountId: (accountId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      DELETE FROM transactions
      WHERE account_id = ? OR target_account_id = ?
    `;
    db.query(sql, [accountId, accountId], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
},

  // Create a transaction (optional)
  create: ({ account_id, target_account_id, type, amount, description }) => {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO transactions (account_id, target_account_id, type, amount, description)
        VALUES (?, ?, ?, ?,?)
      `;
      db.query(sql, [account_id, target_account_id, type, amount, description], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  },
 findStatementByAccountId: (accountId, fromDate, toDate) => {
  const query = `
    SELECT *
    FROM transactions
    WHERE (
      account_id = ?
      OR (target_account_id = ? AND account_id <> ?)
    )
    AND date BETWEEN ? AND ?
    ORDER BY date ASC
  `;

  return new Promise((resolve, reject) => {
    db.query(
      query,
      [accountId, accountId, accountId, fromDate, toDate],
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
},
  // Transfer transaction
transfer: ({ fromAccountId, toAccountNumber, amount }) => {
  return new Promise((resolve, reject) => {
    if (!fromAccountId || !toAccountNumber || !amount || amount <= 0) {
      return reject({ message: "Invalid data" });
    }

    //  START DB TRANSACTION
    db.beginTransaction((err) => {
      if (err) return reject(err);

      const rollback = (error) => {
        db.rollback(() => reject(error));
      };

      const getSource = `
        SELECT id, account_number, balance, user_id
        FROM accounts
        WHERE id = ?
        FOR UPDATE
      `;
      db.query(getSource, [fromAccountId], (err, sourceResult) => {
        if (err) return rollback(err);
        if (!sourceResult.length)
          return rollback({ message: "Source account not found" });

        const source = sourceResult[0];

        if (source.account_number === toAccountNumber) {
          return rollback({ message: "Cannot transfer to same account" });
        }

        if (Number(source.balance) < Number(amount)) {
          return rollback({ message: "Insufficient balance" });
        }

        // 2️⃣ Get target account (LOCKED)
        const getTarget = `
          SELECT id, account_number, balance, user_id
          FROM accounts
          WHERE account_number = ?
          FOR UPDATE
        `;
        db.query(getTarget, [toAccountNumber], (err, targetResult) => {
          if (err) return rollback(err);
          if (!targetResult.length)
            return rollback({ message: "Target account not found" });

          const target = targetResult[0];

          const newSourceBalance = Number(source.balance) - Number(amount);
          const newTargetBalance = Number(target.balance) + Number(amount);

          // 3️⃣ Get sender user
          db.query(
            "SELECT name, contact FROM users WHERE user_id = ?",
            [source.user_id],
            (err, senderUser) => {
              if (err) return rollback(err);

              // 4️⃣ Get receiver user
              db.query(
                "SELECT name, contact FROM users WHERE user_id = ?",
                [target.user_id],
                (err, receiverUser) => {
                  if (err) return rollback(err);

                  const senderName = senderUser[0]?.name || null;
                  const senderContact = senderUser[0]?.contact || null;
                  const receiverName = receiverUser[0]?.name || null;
                  const receiverContact = receiverUser[0]?.contact || null;

                  // 5️⃣ Update balances
                  db.query(
                    "UPDATE accounts SET balance = ? WHERE id = ?",
                    [newSourceBalance, source.id],
                    (err) => {
                      if (err) return rollback(err);

                      db.query(
                        "UPDATE accounts SET balance = ? WHERE id = ?",
                        [newTargetBalance, target.id],
                        (err) => {
                          if (err) return rollback(err);

                          const senderDesc = `Transfer Rs.${amount} to ${target.account_number}`;
                          const receiverDesc = `Received Rs.${amount} from ${source.account_number}`;

                          // 6️⃣ Sender transaction
                          const insertSender = `
                            INSERT INTO transactions
                            (account_id, type, amount, target_account_id, description, date)
                            VALUES (?, 'transfer', ?, ?, ?, NOW())
                          `;
                          db.query(
                            insertSender,
                            [source.id, amount, target.id, senderDesc],
                            (err) => {
                              if (err) return rollback(err);

                              // 7️⃣ Receiver transaction
                              const insertReceiver = `
                                INSERT INTO transactions
                                (account_id, type, amount, target_account_id, description, date)
                                VALUES (?, 'transfer', ?, ?, ?, NOW())
                              `;
                              db.query(
                                insertReceiver,
                                [target.id, amount, source.id, receiverDesc],
                                (err) => {
                                  if (err) return rollback(err);

                                  // ✅ COMMIT
                                  db.commit((err) => {
                                    if (err) return rollback(err);

                                    resolve({
                                      message: "Transfer successful",
                                      amount,
                                      fromBalance: newSourceBalance, toBalance: newTargetBalance,

                                      sender: {
                                        name: senderName,
                                        contact: senderContact,
                                        accountNumber: source.account_number,
                                        balance: newSourceBalance,
                                      },

                                      receiver: {
                                        name: receiverName,
                                        contact: receiverContact,
                                        accountNumber: target.account_number,
                                        balance: newTargetBalance,
                                      },
                                    });
                                  });
                                }
                              );
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        });
      });
    });
  });
},

};

export default Transaction;
