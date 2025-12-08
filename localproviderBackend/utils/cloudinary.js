// src/utils/cloudinary.js
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Upload a local file path to Cloudinary (used for multer temp file).
 * options can include folder, resource_type, etc.
 */
async function uploadLocalFile(localPath, options = {}) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      localPath,
      { resource_type: options.resource_type || 'auto', folder: options.folder || '' },
      (err, result) => {
        // optional: remove local file after upload
        try { fs.unlink(localPath, () => {}); } catch {}
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
}

/**
 * Upload a Buffer/stream to Cloudinary (no disk)
 */
function uploadBuffer(buffer, filename = 'upload', options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: options.resource_type || 'auto', folder: options.folder || '' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

module.exports = { cloudinary, uploadLocalFile, uploadBuffer };
