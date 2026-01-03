const router = require('express').Router();
const ctrl = require('../controllers/providers.controller');
const adminAuth = require('../middleware/adminAuth');
const requireRole = require('../middleware/requireRole');

router.use(adminAuth);

// List & view
router.get('/', requireRole('ADMIN', 'SUPER_ADMIN'), ctrl.list);
router.get('/:id', requireRole('ADMIN', 'SUPER_ADMIN'), ctrl.getById);

// Verification & status
router.patch(
  '/:id/verify',
  requireRole('ADMIN', 'SUPER_ADMIN'),
  ctrl.verify
);

router.patch(
  '/:id/status',
  requireRole('ADMIN', 'SUPER_ADMIN'),
  ctrl.toggleStatus
);

// Update / delete
router.put('/:id', requireRole('ADMIN', 'SUPER_ADMIN'), ctrl.update);
router.delete('/:id', requireRole('SUPER_ADMIN'), ctrl.remove);

// Related data
router.get(
  '/:id/services',
  requireRole('ADMIN', 'SUPER_ADMIN'),
  ctrl.getServices
);

router.get(
  '/:id/reviews',
  requireRole('ADMIN', 'SUPER_ADMIN'),
  ctrl.getReviews
);

router.get(
  '/:id/chats',
  requireRole('ADMIN', 'SUPER_ADMIN'),
  ctrl.getChats
);

module.exports = router;
