/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get the supported category list
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Supported categories returned successfully
 */

const express = require('express');
const { getCategories } = require('../controllers/categoryController');
const protect = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getCategories);

module.exports = router;
