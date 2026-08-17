const express = require('express');
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const {
  uploadDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
} = require('../controllers/documentController');

const router = express.Router();

router.use(protect);

/**
 * @openapi
 * /api/documents/upload:
 *   post:
 *     summary: Upload research papers (PDF, DOCX, TXT, MD, CSV, JSON, code)
 *     tags: [Documents]
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201: { description: Files uploaded and background indexing initiated }
 */
router.post('/upload', upload.array('files', 10), uploadDocument);

/**
 * @openapi
 * /api/documents:
 *   get:
 *     summary: List user documents with search, date, and status filters
 *     tags: [Documents]
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by filename
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [all, pending, processing, completed, failed] }
 *     responses:
 *       200: { description: List of documents }
 */
router.get('/', getDocuments);

/**
 * @openapi
 * /api/documents/{id}:
 *   get:
 *     summary: Get single document details
 *     tags: [Documents]
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Document details }
 *   delete:
 *     summary: Delete document file and associated vectors
 *     tags: [Documents]
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Document deleted }
 */
router.get('/:id', getDocumentById);
router.delete('/:id', deleteDocument);

module.exports = router;
