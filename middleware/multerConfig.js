import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileTypeFromFile } from 'file-type';

// Define uploads directory
const uploadDir = path.join('public', 'uploads');

// Create folder if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    // Use random UUID to prevent path traversal and collision vulnerabilities
    const filename = crypto.randomUUID() + ext;
    cb(null, filename);
  }
});

// Multer upload
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Content-based image file type validation middleware
export const validateProfileImage = async (req, res, next) => {
  if (!req.file) return next();
  try {
    const type = await fileTypeFromFile(req.file.path);
    if (!type || !type.mime.startsWith('image/')) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).render('settings', {
        title: 'Settings',
        activePage: 'settings',
        user: req.session.user || {},
        error: 'Invalid file content: Only genuine image files are allowed.'
      });
    }
    next();
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    return res.status(400).send('Error validating profile image.');
  }
};

