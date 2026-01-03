const router = require('express').Router();
const ctrl = require('../controllers/adminAuth.controller');
const adminAuth = require('../middleware/adminAuth');
const requireRole = require('../middleware/requireRole');

// Public
router.post('/login', ctrl.login);

// Protected
router.get('/me', adminAuth, ctrl.me);

// SUPER_ADMIN only
router.post(
  '/create',
  adminAuth,
  requireRole('SUPER_ADMIN'),
  ctrl.createAdmin
);

router.patch(
  '/:id/role',
  adminAuth,
  requireRole('SUPER_ADMIN'),
  ctrl.updateRole
);

router.patch(
  '/:id/status',
  adminAuth,
  requireRole('SUPER_ADMIN'),
  ctrl.toggleStatus
);

module.exports = router;
