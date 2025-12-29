import express from "express";
import { registerUser, loginUser,  refreshToken, logoutUser, getLoggedInUser , forgotPassword,resetPassword } from "../controllers/authController.js";
import { validateRegister } from "../middleware/validateRegisterMiddleware.js";
import { validateLogin } from "../middleware/validateLoginMiddleware.js";
import { authenticateToken} from "../middleware/authMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", protect,getLoggedInUser);

// POST /api/register
router.post("/register", validateRegister, registerUser);
// POST /api/login
router.post("/login", validateLogin, loginUser);
// GET /api/refresh-token
router.post("/refresh-token",refreshToken);
// POST /api/logout
router.post("/logout", authenticateToken, logoutUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
export default router;
