/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get dashboard summary for the authenticated user
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary fetched successfully
 */
const express = require('express');
const { getDashboard } = require('../controllers/dashboardController');
const protect = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getDashboard);

module.exports = router;
