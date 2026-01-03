const router = require('express').Router();
const ctrl = require('../controllers/audit.controller');
const adminAuth = require('../middleware/adminAuth');
const requireRole = require('../middleware/requireRole');

router.use(adminAuth);
router.use(requireRole('SUPER_ADMIN'));

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);

module.exports = router;
