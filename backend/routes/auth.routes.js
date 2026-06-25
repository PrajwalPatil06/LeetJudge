import express from 'express';
import { signup, login, getMe, googleLogin } from '../controllers/auth.controller.js';
import { validateSignup, validateLogin, validateGoogleLogin } from '../validators/auth.validator.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post("/signup", validateSignup, signup);
router.post("/login", validateLogin, login);
router.post("/google", validateGoogleLogin, googleLogin);
router.get("/me", authenticate, getMe);

export default router;