// src/middleware/auth.js
const jwt = require('jsonwebtoken');
let User = require('../models/User');
if (User && User.default) User = User.default; // tolerate ESM default export

module.exports = async function auth(req, res, next) {
  try {
    // find token in Authorization header, cookie, or x-access-token
    let token = null;

    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token && req.headers['x-access-token']) {
      token = req.headers['x-access-token'];
    }

    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const id = payload.id || payload._id || payload.userId;
    if (!id) return res.status(401).json({ error: 'Invalid token payload' });

    const user = await User.findById(id);
    if (!user) return res.status(401).json({ error: 'Invalid token (user not found)' });

    req.user = user;
    next();
  } catch (err) {
    console.error('auth middleware error', err);
    res.status(500).json({ error: 'Server error' });
  }
};
