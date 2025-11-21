// routes/providers.js
const express = require('express');
const router = express.Router();
const providerController = require('../../controllers/providerController');
const auth = require('../middleware/auth');
const upload = require('../../src/middleware/upload');

// public
router.get('/', providerController.listProviders);
router.get('/me', auth, providerController.getMyProvider);      // new
router.get('/:id', providerController.getProvider);

// protected - accept single file field named "image"
router.post('/', auth, upload.single('image'), providerController.createProvider);
router.put('/:id', auth, upload.single('image'), providerController.updateProvider);
router.delete('/:id', auth, providerController.deleteProvider);

module.exports = router;
