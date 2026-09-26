import express from "express";
import {
  showLogin,
  showRegister,
  login,
  register,
  logout,
} from "../controllers/authController.js";

import {
  validateLogin,
  validateRegister,
} from "../middleware/validators.js";
import { authLimiter } from "../middleware/rateLimiters.js";
import { csrfProtection } from "../middleware/csrfMiddleware.js";

const router = express.Router();

/**
 * Middleware to redirect logged-in users away from login/register pages
 * Prevents access to login/register when already authenticated
 */
const redirectIfAuthenticated = (req, res, next) => {
  if (req.session?.user) {
    return res.redirect("/home");
  }
  next();
};

/**
 * ====================================
 *        Auth Routes (Public)
 * ====================================
 */

// GET /login - Show login page
router.get("/login", redirectIfAuthenticated, showLogin);

// POST /login - Handle login form submission
router.post("/login", authLimiter, csrfProtection, validateLogin, login);

// GET /register - Show registration page
router.get("/register", redirectIfAuthenticated, showRegister);

// POST /register - Handle registration form submission
router.post("/register", authLimiter, csrfProtection, validateRegister, register);

// GET /logout - Logout user
router.get("/logout", logout);

export default router;