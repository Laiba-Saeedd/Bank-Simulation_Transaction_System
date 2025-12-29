// services/transactionService.js
import Transaction from "../models/Transaction.js";
import { sendEmail } from "./emailService.js"; 
import { 
  depositEmailTemplate,
  withdrawalEmailTemplate,
  transferSenderTemplate,
  transferReceiverTemplate
} from "../templates/emailTemplates.js";

// ---------------- Deposit ----------------
export const depositAmount = async (accountId, amount) => {
  const result = await Transaction.deposit({ accountId, amount });

  // Send email if contact is an email
  if (result.contact?.includes("@")) {
    await sendEmail({
      to: result.contact,
      subject: "Deposit Successful",
      html: depositEmailTemplate(result, amount) 
    });
  }

  return result;
};

// ---------------- Withdraw ----------------
export const withdrawAmount = async (accountId, amount) => {
  const result = await Transaction.withdraw({ accountId, amount });

  if (result.contact?.includes("@")) {
    await sendEmail({
      to: result.contact,
      subject: "Withdraw Successful",
      html: withdrawalEmailTemplate(result, amount) 
    });
  }

  return result;
};

// ---------------- Transfer ----------------
export const transferAmount = async (fromAccountId, toAccountNumber, amount) => {
  const result = await Transaction.transfer({ fromAccountId, toAccountNumber, amount });

  // 📨 Sender email
  if (result.sender?.contact?.includes("@")) {
    await sendEmail({
      to: result.sender.contact,
      subject: "Transfer Sent Successfully",
      html: transferSenderTemplate(
        result.sender,
        amount,
        result.receiver
      ),
    });
  }

  // 📨 Receiver email
  if (result.receiver?.contact?.includes("@")) {
    await sendEmail({
      to: result.receiver.contact,
      subject: "Transfer Received Successfully",
      html: transferReceiverTemplate(
        result.receiver,
        amount,
        result.sender
      ),
    });
  }
  return result;
};
export const reverseTransaction = async (transactionId) => {
  const txn = await Transaction.findById(transactionId);
  if (!txn) throw new Error("Transaction not found");
  if (txn.status !== "completed") throw new Error("Only completed txn can be reversed");
  if (txn.reversed) throw new Error("Transaction already reversed");

  let reversal = {
    account_id: txn.account_id,
    amount: txn.amount,
    type: "",
    original_transaction_id: txn.id,
    status: "completed",
    created_at: new Date()
  };

  const sender = await User.findById(txn.account_id);
  let receiver;

  if (txn.type === "deposit") {
    reversal.type = "withdraw";
    sender.balance -= txn.amount;
  } else if (txn.type === "withdraw") {
    reversal.type = "deposit";
    sender.balance += txn.amount;
  } else if (txn.type === "transfer") {
    reversal.type = "transfer";
    // reverse sender
    sender.balance += txn.amount;
    // reverse receiver
    receiver = await User.findById(txn.target_account_id);
    receiver.balance -= txn.amount;

    // Save receiver reversal txn
    await Transaction.create({
      account_id: receiver.id,
      amount: txn.amount,
      type: "transfer_reversal",
      original_transaction_id: txn.id,
      status: "completed",
      created_at: new Date()
    });

    await receiver.save();
    await sendEmail({
      to: receiver.email,
      subject: "Transfer Reversal",
      html: `<p>A transfer sent to your account has been reversed.</p>`
    });
  }

  await sender.save();

  // Save reversal txn
  await Transaction.create(reversal);

  // Mark original transaction as reversed
  txn.reversed = true;
  await txn.save();

  // Notify user
  await sendEmail({
    to: sender.email,
    subject: "Transaction Reversed",
    html: `<p>Your transaction ${txn.id} has been reversed successfully.</p>`
  });
};
