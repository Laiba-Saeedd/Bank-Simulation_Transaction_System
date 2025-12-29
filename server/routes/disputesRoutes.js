import express from "express";
import { createDispute, getDisputesByAccount, getAllDisputesController, reviewDisputeController } from "../controllers/disputesController.js";
import { authenticateToken, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// User raises dispute
router.post("/", authenticateToken, createDispute);

// Admin reviews dispute
router.post("/:id/review", authenticateToken, verifyAdmin(), reviewDisputeController);
router.get("/view", authenticateToken, verifyAdmin(), getAllDisputesController);
// Get all disputed transaction IDs for an account
router.get("/account/:accountId", authenticateToken, getDisputesByAccount);
export default router;
