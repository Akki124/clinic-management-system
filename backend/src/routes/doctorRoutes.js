const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const authenticateToken = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');

router.use(authenticateToken);

// Admin-only doctor creation
router.post('/', requireRole('ADMIN'), doctorController.createDoctor);

// Doctors listing & profile
router.get('/', doctorController.getAllDoctors);
router.get('/:id', doctorController.getDoctorById);
router.put('/:id', doctorController.updateDoctor);

module.exports = router;
