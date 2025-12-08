// src/routes/uploads.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadsController = require('../../controllers/uploadsController');

// Use memory storage for small audio blobs (avoids disk I/O)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// single file field: 'file'
router.post('/audio', upload.single('file'), uploadsController.uploadAudio);

module.exports = router;
