// middleware/auth.js
module.exports = {
  requireAuth: (req, res, next) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    next();
  }
};
