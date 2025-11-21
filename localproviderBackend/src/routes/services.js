const express = require('express');
const router = express.Router();
const serviceController = require('../../controllers/serviceController');

// public list & get
router.get('/', serviceController.listPublicServices);
router.get('/:id', serviceController.getService);

module.exports = router;
