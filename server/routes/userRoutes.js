import express from "express";
import { getAllUsers, updateUser, getUserById } from "../controllers/userController.js";
import {authenticateToken} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticateToken, getAllUsers);
// router.get("/:id", getById);
router.get("/:id", getUserById);
router.put("/update/:id", authenticateToken, updateUser);

export default router;
