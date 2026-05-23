const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const { authMiddleware } = require('../middleware/auth');
const upload  = require('../middleware/upload');
const db      = require('../config/db');

router.post('/', authMiddleware, async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      upload.single('image')(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'File too large. Maximum size is 5 MB.' });
    if (err.code === 'INVALID_TYPE')    return res.status(400).json({ message: err.message });
    return res.status(400).json({ message: err.message || 'Upload failed.' });
  }

  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

  try {
    const imageUrl = '/uploads/' + req.file.filename;
    const [result] = await db.query(
      'INSERT INTO images (filename, url, uploaded_by) VALUES (?, ?, ?)',
      [req.file.filename, imageUrl, req.session.userId]
    );
    res.json({ imageUrl, imageId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: 'Invalid image ID.' });

  try {
    const [rows] = await db.query('SELECT * FROM images WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Image not found.' });

    const image = rows[0];
    const isAdmin = req.session.userRole === 'admin';
    if (image.uploaded_by !== req.session.userId && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    const filePath = path.join(__dirname, '..', 'uploads', image.filename);
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        return res.status(500).json({ message: 'Could not delete file.' });
      }
    });

    await db.query('DELETE FROM images WHERE id = ?', [id]);
    res.json({ message: 'Deleted.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
