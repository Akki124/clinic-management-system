const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const authenticateToken = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');

router.use(authenticateToken);
router.use(requireRole('ADMIN')); // All staff management is Admin only

router.post('/', staffController.createStaff);
router.get('/', staffController.getAllStaff);
router.put('/:id', staffController.updateStaff);

module.exports = router;
