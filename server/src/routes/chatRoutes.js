const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  createChat,
  getChats,
  getChatById,
  sendMessage,
  sendMessageStream,
  updateChatTitle,
  deleteChat,
} = require('../controllers/chatController');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

router.use(protect);

/**
 * @openapi
 * /api/chats:
 *   post:
 *     summary: Create a new chat session
 *     tags: [Chats]
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, example: "Quantum Computing Analysis" }
 *               documentIds: { type: array, items: { type: string } }
 *     responses:
 *       201: { description: Chat created }
 *   get:
 *     summary: List all user chat sessions
 *     tags: [Chats]
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200: { description: List of chats }
 */
router.post('/', validate(schemas.createChat), createChat);
router.get('/', getChats);

/**
 * @openapi
 * /api/chats/{id}:
 *   get:
 *     summary: Get chat details with full message history and citations
 *     tags: [Chats]
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Chat history retrieved }
 *   patch:
 *     summary: Rename chat session title
 *     tags: [Chats]
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string, example: "Updated Chat Title" }
 *     responses:
 *       200: { description: Title updated }
 *   delete:
 *     summary: Delete chat session
 *     tags: [Chats]
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Chat deleted }
 */
router.get('/:id', getChatById);
router.patch('/:id', validate(schemas.updateChatTitle), updateChatTitle);
router.delete('/:id', deleteChat);

/**
 * @openapi
 * /api/chats/{id}/messages:
 *   post:
 *     summary: Send question query and get JSON RAG response
 *     tags: [Chats]
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query]
 *             properties:
 *               query: { type: string, example: "What is the primary contribution of this paper?" }
 *               documentIds: { type: array, items: { type: string } }
 *     responses:
 *       200: { description: RAG answer with citations and retrieval stats }
 */
router.post('/:id/messages', validate(schemas.sendMessage), sendMessage);

/**
 * @openapi
 * /api/chats/{id}/messages/stream:
 *   post:
 *     summary: Stream RAG response token-by-token using Server-Sent Events (SSE)
 *     tags: [Chats]
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query]
 *             properties:
 *               query: { type: string }
 *               documentIds: { type: array, items: { type: string } }
 *     responses:
 *       200: { description: SSE stream (event: stats, event: citations, event: token, event: done) }
 */
router.post('/:id/messages/stream', validate(schemas.sendMessage), sendMessageStream);

module.exports = router;
