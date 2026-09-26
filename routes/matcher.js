import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileTypeFromFile } from 'file-type';
import requireLogin from '../middleware/requireLogin.js';
import {
  renderHome,
  handleMatch,
  historyPage
} from '../controllers/matcherController.js';
import { matchLimiter } from '../middleware/rateLimiters.js';
import { csrfProtection } from '../middleware/csrfMiddleware.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.pdf';
    cb(null, crypto.randomUUID() + ext);
  }
});

// Multer config for PDF uploads
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'));
    }
  }
});

// Content-based PDF validation middleware
export const validateResumePdf = async (req, res, next) => {
  if (!req.file) return next();
  try {
    const type = await fileTypeFromFile(req.file.path);
    if (!type || type.mime !== 'application/pdf') {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).render('index', {
        score: null,
        feedback: [],
        highlightedJD: null,
        presentSkills: [],
        missingSkills: [],
        error: 'Invalid file content: Only genuine PDF files are allowed.'
      });
    }
    next();
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    return res.status(400).send('Error validating PDF file.');
  }
};

// Protected Routes (require login)
router.get('/match', requireLogin, renderHome);
router.post('/match', requireLogin, matchLimiter, upload.single('resume'), validateResumePdf, csrfProtection, handleMatch);
router.get('/history', requireLogin, historyPage);

export default router;


