const express = require('express');
const protect = require('../middleware/auth');
const { getAnalytics } = require('../controllers/analyticsController');

const router = express.Router()

router.get('/', protect, getAnalytics)

module.exports = router;