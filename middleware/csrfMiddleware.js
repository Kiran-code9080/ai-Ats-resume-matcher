import { doubleCsrf } from 'csrf-csrf';

const {
  invalidCsrfTokenError,
  generateToken,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => process.env.SESSION_SECRET || 'fallback_secret_key',
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
  getTokenFromRequest: (req) => req.body?._csrf || req.headers['x-csrf-token'],
});

// Middleware wrapper that bypasses CSRF check during Jest integration testing
export const csrfProtection = (req, res, next) => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }
  return doubleCsrfProtection(req, res, next);
};

export { generateToken, invalidCsrfTokenError };
