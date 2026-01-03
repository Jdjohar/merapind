const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const logAudit = require('../utils/logAudit');

// ---------------------
// LIST USERS
// ---------------------
exports.list = async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users);
};

// ---------------------
// GET USER
// ---------------------
exports.getById = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
};

// ---------------------
// UPDATE USER
// ---------------------
exports.update = async (req, res) => {
  const { role } = req.body;

  if (role && !['USER', 'PROVIDER'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (role) {
    user.role = role;
  }

  await user.save();

  await logAudit(req, 'USER_ROLE_UPDATED', 'USER', user._id, {
    role
  });

  res.json({ ok: true });
};

// ---------------------
// ACTIVATE / DEACTIVATE USER
// ---------------------
exports.toggleStatus = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.isActive = !user.isActive;
  await user.save();

  await logAudit(req, 'USER_STATUS_CHANGED', 'USER', user._id);
  res.json({ ok: true });
};

// ---------------------
// FORCE PASSWORD RESET
// ---------------------
exports.forceResetPassword = async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword) {
    return res.status(400).json({ error: 'New password required' });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();

  await logAudit(req, 'USER_PASSWORD_RESET', 'USER', user._id);

  res.json({ ok: true });
};

// ---------------------
// DELETE (SOFT DELETE RECOMMENDED)
// ---------------------
exports.remove = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.isDeleted = true;
  await user.save();

  await logAudit(req, 'USER_DELETED', 'USER', user._id);
  res.json({ ok: true });
};
// ---------------------
// UPDATE USER ROLE (ADMIN / SUPER_ADMIN)
// ---------------------
exports.updateRole = async (req, res) => {
  const { role } = req.body;

  if (!['USER', 'PROVIDER'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.role = role;
  await user.save();

  await logAudit(req, 'USER_ROLE_UPDATED', 'USER', user._id);

  res.json({ ok: true });
};
