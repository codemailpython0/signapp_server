import express from 'express';
import { register, login, verifyOtp } from '../controllers/AuthController.js';

const router = express.Router();

// 🔐 User Registration
router.post('/register', register);

// ✅ OTP Verification
router.post('/verify-otp', verifyOtp);

// 🔑 Login
router.post('/login', login);

export default router;
