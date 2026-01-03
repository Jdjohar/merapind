const router = require('express').Router();
const ctrl = require('../controllers/dashboard.controller');
const adminAuth = require('../middleware/adminAuth');

router.get('/overview', adminAuth, ctrl.overview);

module.exports = router;
