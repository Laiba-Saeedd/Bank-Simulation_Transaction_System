// server/routes/adminUsersRoutes.js
import express from "express";
import { getAllUsers, getUserById, updateUser, deleteUser, blockUser,unblockUser } from "../controllers/adminUsersController.js";
import { authenticateToken, verifyAdmin} from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes below are /admin/users 
router.get("/users", authenticateToken, verifyAdmin(), getAllUsers);
router.get("/users/:id", authenticateToken, verifyAdmin(), getUserById);
router.put("/users/:id", authenticateToken, verifyAdmin(), updateUser);
router.delete("/users/:id", authenticateToken, verifyAdmin(), deleteUser);
// PATCH /admin/users/:id/block
router.patch("/users/:id/block", authenticateToken, blockUser);

// PATCH /admin/users/:id/unblock
router.patch("/users/:id/unblock", authenticateToken, unblockUser);

export default router;
