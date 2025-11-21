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
 * Upload a local file to Cloudinary and remove the local file.
 * @param {string} localPath - path to local file
 * @param {object} options - optional upload options
 * @returns {Promise<object>} - Cloudinary upload result
 */
async function uploadLocalFile(localPath, options = {}) {
  try {
    const res = await cloudinary.uploader.upload(localPath, options);
    // remove local file
    fs.unlink(localPath, (err) => { if (err) console.warn('Failed to delete tmp file', err); });
    return res;
  } catch (err) {
    // attempt remove local file on failure too
    try { fs.unlink(localPath, () => {}); } catch {}
    throw err;
  }
}

module.exports = { cloudinary, uploadLocalFile };
