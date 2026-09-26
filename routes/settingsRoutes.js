import express from 'express';
import requireLogin from '../middleware/requireLogin.js';
import { updateProfile, changePassword } from '../controllers/settingsController.js';
import { upload, validateProfileImage } from '../middleware/multerConfig.js';
import { csrfProtection } from '../middleware/csrfMiddleware.js';

const router = express.Router();

// Update personal details + profile image
router.post('/settings/update-profile', requireLogin, upload.single('profileImage'), validateProfileImage, csrfProtection, updateProfile);

// Change password
router.post('/settings/change-password', requireLogin, csrfProtection, changePassword);

export default router;


