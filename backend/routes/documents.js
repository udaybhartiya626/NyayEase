const express = require('express');
const {
  uploadDocument,
  getDocuments,
  getDocument,
  downloadDocument,
  deleteDocument
} = require('../controllers/documents');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router({ mergeParams: true });

router.route('/')
  .get(protect, getDocuments)
  .post(protect, upload.single('document'), uploadDocument);

router.route('/:id')
  .get(protect, getDocument)
  .delete(protect, deleteDocument);

router.get('/:id/download', protect, downloadDocument);

module.exports = router;