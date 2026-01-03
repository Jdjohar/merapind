const router = require('express').Router();
const ctrl = require('../controllers/services.controller');
const adminAuth = require('../middleware/adminAuth');
const requireRole = require('../middleware/requireRole');

router.use(adminAuth);

// list all services
router.get('/', requireRole('ADMIN', 'SUPER_ADMIN'), ctrl.list);

// activate / suspend
router.patch(
  '/:id/status',
  requireRole('ADMIN', 'SUPER_ADMIN'),
  ctrl.toggleStatus
);

// delete service
router.delete(
  '/:id',
  requireRole('SUPER_ADMIN'),
  ctrl.remove
);

module.exports = router;
