const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

router.get('/dashboard', reportsController.getDashboardStats);

module.exports = router;
