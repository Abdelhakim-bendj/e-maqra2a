import { Router } from "express";
import {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected routes
router.post("/logout", authenticate, logout);
router.get("/profile", authenticate, getProfile);
router.patch("/profile", authenticate, updateProfile);

export default router;
