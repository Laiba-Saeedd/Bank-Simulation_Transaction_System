import express from "express";
import {
  createAccountController,
  getAllAccounts,
  getAccountById,
  getAccountsByUserId,
  getAccountsByAccountNumber,
  updateAccountById,
  updateAccountByUserId,
  deleteAccountById,
  deleteAccountsByUserId,
  getUserAccount,
  getAccountStatement,
  getAccountStatementCSV,
  getAccountStatementExcel,
  getAccountStatementPDF
} from "../controllers/accountsController.js";
import { authenticateToken, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create account (Admin only)
router.post("/accounts", authenticateToken, verifyAdmin(), createAccountController);

// Get all accounts (Admin only)
router.get("/accounts", authenticateToken, verifyAdmin(), getAllAccounts);

// Get single account by ID
router.get("/accounts/:id", authenticateToken, getAccountById);

// Get single account by User ID
router.get("/accounts/user/:id", authenticateToken, getAccountsByUserId);
router.get("/accounts/number/:number",  getAccountsByAccountNumber);
// Update account by ID (Admin only)
router.put("/accounts/:id", authenticateToken, verifyAdmin(), updateAccountById);

// JSON
router.get("/accounts/statement",authenticateToken,getAccountStatement);
// CSV
router.get("/accounts/statement/csv",authenticateToken, getAccountStatementCSV);
// Excel
router.get("/accounts/statement/excel",authenticateToken,getAccountStatementExcel);
// PDF
router.get("/accounts/statement/pdf",authenticateToken, getAccountStatementPDF);

// Update account by User ID (Admin only)
// Body should include accountId to update and fields to change
router.put("/accounts/user/:userId", authenticateToken, verifyAdmin(), updateAccountByUserId);

// Delete account by ID (Admin only)
router.delete("/accounts/:id", authenticateToken, verifyAdmin(), deleteAccountById);

// Delete accounts by User ID (Admin only)
// Can delete one or multiple accounts for a user
router.delete("/accounts/user/:userId", authenticateToken, verifyAdmin(), deleteAccountsByUserId);
router.get("/accounts/user/:userId",authenticateToken, getUserAccount);


export default router;
