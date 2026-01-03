const router = require('express').Router();
const ctrl = require('../controllers/users.controller');
const adminAuth = require('../middleware/adminAuth');
const requireRole = require('../middleware/requireRole');

router.use(adminAuth);
router.use(requireRole('ADMIN', 'SUPER_ADMIN'));

// LIST USERS
router.get('/', ctrl.list);

// GET USER
router.get('/:id', ctrl.getById);

// UPDATE USER (role, etc.)
router.patch('/:id', ctrl.update);

// ACTIVATE / DEACTIVATE USER
router.patch('/:id/toggle', ctrl.toggleStatus);

// FORCE PASSWORD RESET
router.patch('/:id/reset-password', ctrl.forceResetPassword);

// SOFT DELETE (SUPER_ADMIN only)
router.delete(
  '/:id',
  requireRole('SUPER_ADMIN'),
  ctrl.remove
);

module.exports = router;
