const express = require('express');
const { register, login, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, fullName]
 *             properties:
 *               email: { type: string, example: "user@example.com" }
 *               password: { type: string, example: "secret123" }
 *               fullName: { type: string, example: "John Doe" }
 *     responses:
 *       210: { description: User registered successfully }
 *       400: { description: Validation error or Email already exists }
 */
router.post('/register', validate(schemas.register), register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user & issue JWT
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "user@example.com" }
 *               password: { type: string, example: "secret123" }
 *     responses:
 *       200: { description: Login successful with JWT token }
 *       401: { description: Invalid credentials }
 */
router.post('/login', validate(schemas.login), login);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user profile
 *     tags: [Authentication]
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200: { description: User profile retrieved }
 *       401: { description: Unauthorized }
 */
router.get('/me', protect, getMe);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Logout user session
 *     tags: [Authentication]
 *     responses:
 *       200: { description: Logged out }
 */
router.post('/logout', logout);

module.exports = router;
