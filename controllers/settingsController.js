import User from '../models/User.js';  // << correct path
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';

// Update profile info + profile image
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);

    if (req.body.username) user.name = req.body.username;
    if (req.body.email) user.email = req.body.email;

    if (req.file) {
      if (user.profileImage) {
        const oldPath = path.join('public/uploads', user.profileImage);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      user.profileImage = req.file.filename;
    }

    await user.save();
    req.session.user = user;
    res.redirect('/settings');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating profile.');
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const user = await User.findById(req.session.user._id);

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.send('Current password is incorrect');

    // Check new passwords match
    if (newPassword !== confirmPassword) return res.send('Passwords do not match');

    // Assign plain new password, let pre-save hook hash it
    user.password = newPassword;
    await user.save();

    res.redirect('/settings');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error changing password.');
  }
};