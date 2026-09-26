export default function requireLogin(req, res, next) {
  if (req.session && req.session.user) {
    // User is authenticated
    return next();
  }

  console.log('⚠️ Unauthorized access attempt to:', req.originalUrl);
  res.redirect('/login');
}
