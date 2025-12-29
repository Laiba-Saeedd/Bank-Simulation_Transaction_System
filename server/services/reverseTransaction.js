import db from "../config/db.js";

const reverseTransaction = async (transactionId) => {
  const connection = db.promise();
  await connection.beginTransaction();

  try {
    // Get the original transaction
    const [[tx]] = await connection.query(
      "SELECT * FROM transactions WHERE transaction_id = ?",
      [transactionId]
    );

    if (!tx) throw new Error("Transaction not found");

    const amount = Number(tx.amount);

    // Helper to get account balance
    const getBalance = async (id) => {
      const [[r]] = await connection.query(
        "SELECT balance FROM accounts WHERE id = ?",
        [id]
      );
      return Number(r.balance);
    };

    let newTxId; // for storing new transaction ID

    // ---- DEPOSIT REVERSE ----
    if (tx.type === "deposit") {
      const bal = await getBalance(tx.account_id);

      if (bal < amount) throw new Error("Insufficient balance");

      await connection.query(
        "UPDATE accounts SET balance = ? WHERE id = ?",
        [bal - amount, tx.account_id]
      );

      const [result] = await connection.query(
        `INSERT INTO transactions
        (account_id, type, amount, description, date, original_transaction_id, reversed)
        VALUES (?, 'withdraw', ?, 'Reversal of deposit', NOW(), ?, 1)`,
        [tx.account_id, amount, tx.transaction_id]
      );
      newTxId = result.insertId;

      // Mark original transaction as reversed
      await connection.query(
        "UPDATE transactions SET reversed = 1 WHERE transaction_id = ?",
        [transactionId]
      );
    }

    // ---- WITHDRAW REVERSE ----
    else if (tx.type === "withdraw") {
      const bal = await getBalance(tx.account_id);

      await connection.query(
        "UPDATE accounts SET balance = ? WHERE id = ?",
        [bal + amount, tx.account_id]
      );

      const [result] = await connection.query(
        `INSERT INTO transactions
        (account_id, type, amount, description, date, original_transaction_id, reversed)
        VALUES (?, 'deposit', ?, 'Reversal of withdrawal', NOW(), ?, 1)`,
        [tx.account_id, amount, tx.transaction_id]
      );
      newTxId = result.insertId;

      await connection.query(
        "UPDATE transactions SET reversed = 1 WHERE transaction_id = ?",
        [transactionId]
      );
    }

    // ---- TRANSFER REVERSE ----
    else if (tx.type === "transfer") {
      if (!tx.target_account_id) throw new Error("Target missing");

      const senderBal = await getBalance(tx.account_id);
      const receiverBal = await getBalance(tx.target_account_id);

      if (receiverBal < amount) throw new Error("Receiver insufficient balance");

      // Reverse sender and receiver balances
      await connection.query(
        "UPDATE accounts SET balance = ? WHERE id = ?",
        [senderBal + amount, tx.account_id]
      );
      await connection.query(
        "UPDATE accounts SET balance = ? WHERE id = ?",
        [receiverBal - amount, tx.target_account_id]
      );

      // Reverse transaction for sender
      const [res1] = await connection.query(
        `INSERT INTO transactions
        (account_id, target_account_id, type, amount, description, date, original_transaction_id, reversed)
        VALUES (?, ?, 'deposit', ?, 'Reversal transfer sender', NOW(), ?, 1)`,
        [tx.account_id, tx.target_account_id, amount, tx.transaction_id]
      );

      // Reverse transaction for receiver
      const [res2] = await connection.query(
        `INSERT INTO transactions
        (account_id, target_account_id, type, amount, description, date, original_transaction_id, reversed)
        VALUES (?, ?, 'withdraw', ?, 'Reversal transfer receiver', NOW(), ?, 1)`,
        [tx.target_account_id, tx.account_id, amount, tx.transaction_id]
      );

      newTxId = [res1.insertId, res2.insertId];

      // Mark original transfer as reversed
      await connection.query(
        "UPDATE transactions SET reversed = 1 WHERE transaction_id = ?",
        [transactionId]
      );
    }

    else {
      throw new Error("Unsupported transaction type");
    }

    await connection.commit();
    return true;
  } catch (err) {
    await connection.rollback();
    throw err;
  }
};

export default reverseTransaction;
