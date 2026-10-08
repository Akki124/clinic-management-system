const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const authenticateToken = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');

router.use(authenticateToken);

router.post('/', requireRole('ADMIN'), prescriptionController.createPrescription);
router.get('/patient/:id', prescriptionController.getPatientPrescriptions);
router.get('/:id', prescriptionController.getPrescriptionById);

module.exports = router;
