const jwt = require('jsonwebtoken');
const Admin = require('../../models/Admin');

module.exports = async function adminAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    const payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

    const admin = await Admin.findById(payload.id);
    if (!admin || !admin.isActive) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.admin = {
      id: admin._id.toString(),
      role: admin.role
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
