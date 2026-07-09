'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const { config } = require('../config');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/avif': '.avif' };

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const id = crypto.randomBytes(8).toString('hex');
    cb(null, `${Date.now()}-${id}${EXT[file.mimetype] || ''}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) return cb(null, true);
    cb(Object.assign(new Error('unsupported_type'), { code: 'UNSUPPORTED_TYPE' }));
  },
});

/**
 * POST /admin/api/media — upload a hero or in-body image.
 * Returns an absolute URL (served from this backend / a Railway volume).
 * Production note: swap disk storage for S3/Cloudflare R2 for durability.
 */
router.post('/', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      const code = err.code === 'LIMIT_FILE_SIZE' ? 'file_too_large' : (err.code === 'UNSUPPORTED_TYPE' ? 'unsupported_type' : 'upload_failed');
      return res.status(400).json({ error: code });
    }
    if (!req.file) return res.status(400).json({ error: 'no_file' });
    const url = `${config.appUrl.replace(/\/$/, '')}/uploads/${req.file.filename}`;
    res.status(201).json({ url, filename: req.file.filename, size: req.file.size });
  });
});

module.exports = router;
