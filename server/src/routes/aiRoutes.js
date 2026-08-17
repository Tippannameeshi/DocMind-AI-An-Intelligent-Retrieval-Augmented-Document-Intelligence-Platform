const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { generateFeature } = require('../controllers/aiController');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

router.use(protect);

/**
 * @openapi
 * /api/ai/generate:
 *   post:
 *     summary: Generate AI document insights (summary, quiz, flashcards, contributions, future_work)
 *     tags: [AI Features]
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [documentId, featureType]
 *             properties:
 *               documentId: { type: string, example: "uuid-document-id" }
 *               featureType: { type: string, enum: [summary, quiz, flashcards, contributions, future_work], example: "summary" }
 *     responses:
 *       200: { description: AI feature generated successfully }
 *       400: { description: Invalid parameters }
 */
router.post('/generate', validate(schemas.generateAiFeature), generateFeature);

module.exports = router;
