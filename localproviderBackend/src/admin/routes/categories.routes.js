const router = require('express').Router();
const ctrl = require('../controllers/categories.controller');
const adminAuth = require('../middleware/adminAuth');
const requireRole = require('../middleware/requireRole');

router.use(adminAuth);
router.get( '/with-counts', requireRole('ADMIN', 'SUPER_ADMIN'), ctrl.listWithCounts );
router.get('/', requireRole('ADMIN', 'SUPER_ADMIN'), ctrl.list);
router.post('/', requireRole('ADMIN', 'SUPER_ADMIN'), ctrl.create);
router.put('/:id', requireRole('ADMIN', 'SUPER_ADMIN'), ctrl.update);
router.delete('/:id', requireRole('SUPER_ADMIN'), ctrl.remove);
router.patch('/:id/order', requireRole('ADMIN', 'SUPER_ADMIN'), ctrl.updateOrder);

module.exports = router;
