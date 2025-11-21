// src/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// temp uploads dir
const uploadsDir = path.join(process.cwd(), 'tmp-uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// disk storage for multer (temporary)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const safe = Date.now() + '-' + file.originalname.replace(/\s+/g, '-');
    cb(null, safe);
  }
});

// only accept images
const fileFilter = function (req, file, cb) {
  if (/^image\/(jpe?g|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
  else cb(new Error('Invalid file type. Only images are allowed.'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit per file
});

module.exports = upload;
