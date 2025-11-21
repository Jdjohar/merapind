// src/routes/serviceRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const serviceController = require('../../controllers/serviceController');
const upload = require('../middleware/upload'); // multer middleware optional - accepts single 'image' or multiple

// Public listing & get
router.get('/public', serviceController.listPublicServices); // e.g. /api/services/public?q=plumbing
router.get('/public/:id', serviceController.getService);

// Provider-specific (protected) - allow multipart upload for images
router.post('/provider', auth, upload.single('image'), serviceController.createService);
router.get('/provider', auth, serviceController.listProviderServices);
router.get('/provider/:id', auth, serviceController.getService);
router.put('/provider/:id', auth, upload.single('image'), serviceController.updateService);
router.delete('/provider/:id', auth, serviceController.deleteService);

module.exports = router;
