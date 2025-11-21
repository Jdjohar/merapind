const express = require('express');
const router = express.Router();
const categoryController = require('../../controllers/categoryController');
const auth = require('../middleware/auth');

router.get('/', categoryController.listCategories);
router.post('/', auth, categoryController.createCategory);

module.exports = router;
