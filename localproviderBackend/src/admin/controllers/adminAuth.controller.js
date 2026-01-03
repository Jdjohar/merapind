const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../../models/Admin');
const logAudit = require('../utils/logAudit');

// ---------------------
// Helpers
// ---------------------
const signToken = (admin) =>
  jwt.sign(
    { id: admin._id, role: admin.role },
    process.env.ADMIN_JWT_SECRET,
    { expiresIn: '1d' }
  );

// ---------------------
// LOGIN (already used)
// ---------------------
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email });
  if (!admin || !admin.isActive) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const ok = await bcrypt.compare(password, admin.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  res.json({
    admin: {
      id: admin._id,
      name: admin.name,
      role: admin.role
    },
    accessToken: signToken(admin)
  });
};

// ---------------------
// ME
// ---------------------
exports.me = async (req, res) => {
  const admin = await Admin.findById(req.admin.id).select('-password');
  res.json(admin);
};

// ---------------------
// CREATE ADMIN (SUPER_ADMIN)
// ---------------------
exports.createAdmin = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const exists = await Admin.findOne({ email });
  if (exists) {
    return res.status(409).json({ error: 'Admin already exists' });
  }

  const hashed = await bcrypt.hash(password, 12);

  const admin = await Admin.create({
    name,
    email,
    password: hashed,
    role: role || 'ADMIN'
  });

  await logAudit(req, 'ADMIN_CREATED', 'SYSTEM', admin._id);

  res.status(201).json({
    id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role
  });
};

// ---------------------
// UPDATE ROLE (SUPER_ADMIN)
// ---------------------
exports.updateRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['SUPER_ADMIN', 'ADMIN', 'SUPPORT'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  if (req.admin.id === id) {
    return res.status(400).json({ error: 'Cannot change your own role' });
  }

  const admin = await Admin.findById(id);
  if (!admin) return res.status(404).json({ error: 'Admin not found' });

  const oldRole = admin.role;
  admin.role = role;
  admin.tokenVersion += 1; // force logout
  await admin.save();

  await logAudit(req, 'ADMIN_ROLE_UPDATED', 'SYSTEM', admin._id, {
    from: oldRole,
    to: role
  });

  res.json({ ok: true });
};

// ---------------------
// ACTIVATE / DEACTIVATE ADMIN
// ---------------------
exports.toggleStatus = async (req, res) => {
  const { id } = req.params;

  if (req.admin.id === id) {
    return res.status(400).json({ error: 'Cannot deactivate yourself' });
  }

  const admin = await Admin.findById(id);
  if (!admin) return res.status(404).json({ error: 'Admin not found' });

  admin.isActive = !admin.isActive;
  admin.tokenVersion += 1; // revoke sessions
  await admin.save();

  await logAudit(req, 'ADMIN_STATUS_CHANGED', 'SYSTEM', admin._id, {
    isActive: admin.isActive
  });

  res.json({ ok: true });
};
