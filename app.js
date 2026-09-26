// ============================
// Imports & Configs
// ============================
import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import path from 'path';
import { fileURLToPath } from 'url';
import expressLayouts from 'express-ejs-layouts';
import helmet from 'helmet';

import authRoutes from './routes/auth.js';
import matcherRoutes from './routes/matcher.js';
import settingsRoutes from './routes/settingsRoutes.js';
import requireLogin from './middleware/requireLogin.js';
import MatchHistory from './models/match.js';
import User from './models/User.js';
import { generateToken } from './middleware/csrfMiddleware.js';

// ============================
// Path Setup
// ============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust reverse proxy for HTTPS secure cookies in production (Render, Railway, etc.)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
      },
    },
  })
);

// ============================
// Middleware
// ============================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================
// EJS + Layouts
// ============================
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout'); // Default layout (views/layout.ejs)

// ============================
// Session Setup
// ============================
if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is not set in .env');
}
if (!process.env.MONGO_URI) {
  throw new Error('MONGO_URI is not set in .env');
}

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: 'sessions',
      ttl: 24 * 60 * 60, // 1 day
      autoRemove: 'interval', // Optional: clean up expired sessions
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// ============================
// Global View Locals
// ============================
app.use((req, res, next) => {
  res.locals.title = 'Resume Matcher';
  res.locals.user = req.session.user || null;
  res.locals.activePage = '';
  res.locals.error = null;
  res.locals.csrfToken = generateToken(req, res);
  next();
});

// ============================
// MongoDB Connection
// ============================
async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ MongoDB Connected');
    } catch (err) {
      console.error('❌ MongoDB Connection Error:', err.message);
      process.exit(1);
    }
  }
}
connectDB();

// ============================
// Routes
// ============================

// Default redirect
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Auth Routes (login, register, logout)
app.use('/', authRoutes);

// ============================
// Protected Routes (require login)
// ============================
app.get('/home', requireLogin, (req, res) => {
  res.render('home', { title: 'Home', activePage: 'home' });
});

app.get('/profile', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    res.render('profile', { title: 'Profile', activePage: 'profile', user });
  } catch (err) {
    console.error(err);
    res.render('profile', {
      title: 'Profile',
      activePage: 'profile',
      user: {},
      error: 'Unable to load profile.'
    });
  }
});

app.get('/details', requireLogin, (req, res) => {
  res.render('details', { title: 'Details', activePage: 'details' });
});

app.get('/history', requireLogin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    const totalItems = await MatchHistory.countDocuments({ userId: req.session.user._id });
    const totalPages = Math.ceil(totalItems / limit);

    const items = await MatchHistory.find({ userId: req.session.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.render('history', {
      title: 'History',
      activePage: 'history',
      items,
      currentPage: page,
      totalPages
    });
  } catch (err) {
    console.error(err);
    res.render('history', {
      title: 'History',
      activePage: 'history',
      items: [],
      currentPage: 1,
      totalPages: 1,
      error: 'Error loading match history.'
    });
  }
});

app.get('/settings', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    res.render('settings', { title: 'Settings', activePage: 'settings', user });
  } catch (err) {
    console.error(err);
    res.render('settings', {
      title: 'Settings',
      activePage: 'settings',
      user: {},
      error: 'Unable to load settings.'
    });
  }
});

app.use('/', requireLogin, matcherRoutes);
app.use('/', requireLogin, settingsRoutes);

// ============================
// 404 Page
// ============================
app.use((req, res) => {
  res.status(404).render('404', { title: '404 Not Found' });
});

// ============================
// Global Error Handler
app.use((err, req, res, next) => {
  if (req.file && fs.existsSync(req.file.path)) {
    try { fs.unlinkSync(req.file.path); } catch (e) {}
  }
  if (err.code === 'EBADCSRFTOKEN' || err.message?.includes('csrf') || err.message?.includes('CSRF')) {
    return res.status(403).send('CSRF validation failed. Invalid or missing CSRF token.');
  }
  console.error('Unhandled error:', err);
  res.status(500).render('500', { title: 'Server Error', error: err.message });
});

// ============================
// Export
// ============================
export default app;

// ============================
// Start Server
// ============================
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
}