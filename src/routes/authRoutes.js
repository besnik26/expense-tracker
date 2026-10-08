/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *           example:
 *             name: Jane Doe
 *             email: jane@example.com
 *             password: secret123
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in an existing user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *           example:
 *             email: jane@example.com
 *             password: secret123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Informs the client to clear the JWT token
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: Logout confirmation
 */

const express = require('express');
const { body } = require('express-validator');
const { registerUser, loginUser, logoutUser } = require('../controllers/authController');
const validateRequest = require('../validators/validateRequest');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ],
  validateRequest,
  registerUser
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  loginUser
);

router.post('/logout', logoutUser);

module.exports = router;
