import { raiseDispute, reviewDispute, fetchActiveDisputesByAccount, getAllDisputes } from "../services/disputeService.js";

/* ============================
   User Raises Dispute
============================ */
export const createDispute = async (req, res) => {
  try {
    const { transactionId, reason } = req.body;
    await raiseDispute(req.user.id, transactionId, reason);
    res.json({ message: "Dispute raised successfully" });
  } catch (err) {
    console.error("Error raising dispute:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ============================
   Admin Reviews Dispute
============================ */
export const reviewDisputeController = async (req, res) => {
  try {
    const disputeId = Number(req.params.id);
    const { approve } = req.body;

    // 🔐 VALIDATION
    if (!disputeId || isNaN(disputeId)) {
      return res.status(400).json({ message: "Invalid dispute ID" });
    }

    await reviewDispute(disputeId, approve);
    res.json({ message: `Dispute ${approve ? "approved" : "rejected"}` });

  } catch (err) {
    console.error("Review dispute error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ============================
   Get Disputes by Account
============================ */
export const getDisputesByAccount = async (req, res) => {
  try {
    const accountId = req.params.accountId;

    if (!accountId)
      return res.status(400).json({ message: "Account ID required" });

    const disputedTransactionIds = await fetchActiveDisputesByAccount(accountId);

    res.json(disputedTransactionIds);
  } catch (err) {
    console.error("Error fetching disputes:", err);
    res.status(500).json({ message: "DB error" });
  }
};

// Admin: Get all disputes
export const getAllDisputesController = async (req, res) => {
  try {
    const disputes = await getAllDisputes();
    res.json(disputes);
  } catch (err) {
    console.error("Controller Error:", err);
    res.status(500).json({
      message: "Failed to fetch disputes",
      error: err.message || err
    });
  }
};
