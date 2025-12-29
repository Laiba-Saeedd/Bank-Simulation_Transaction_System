import express from "express";
import {
  depositController,
  withdrawController,
  transferController,
  getTransactionHistory,
  getTransactionsByAccount,
  getTransactionsByDate
} from "../controllers/transactionController.js";

import {authenticateToken} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/deposit", authenticateToken, depositController);
router.post("/withdraw", authenticateToken, withdrawController); 
router.post("/transfer", authenticateToken, transferController);
// router.get("/:account_id", getTransactionHistory);
// Get all transactions
router.get("/:accountId", authenticateToken, getTransactionsByAccount);

// Get transactions by date
router.get("/:accountId/date", authenticateToken, getTransactionsByDate);

export default router;
