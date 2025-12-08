// src/controllers/uploadsController.js
const path = require('path');
const { uploadLocalFile, uploadBuffer } = require('../utils/cloudinary');

/**
 * POST /api/uploads/audio
 * Accepts multipart form-data with field 'file'
 * Uses multer to store temp file OR uses buffer from multer.memoryStorage
 */
exports.uploadAudio = async (req, res) => {
  try {
    // If multer used memoryStorage, file.buffer will exist
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded (expected form field "file")' });
    }

    // If file is in memory (preferred) use uploadBuffer
    if (req.file.buffer) {
      const r = await uploadBuffer(req.file.buffer, req.file.originalname, { folder: 'serviconnect/audio' });
      return res.json({ ok: true, audioUrl: r.secure_url, raw: r });
    }

    // Otherwise multer stored file on disk -> uploadLocalFile
    const localPath = req.file.path;
    const r = await uploadLocalFile(localPath, { folder: 'serviconnect/audio' });
    return res.json({ ok: true, audioUrl: r.secure_url, raw: r });
  } catch (err) {
    console.error('uploadAudio error', err);
    return res.status(500).json({ error: 'Upload failed', details: err.message || err });
  }
};
