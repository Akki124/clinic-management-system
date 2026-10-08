const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const visitController = require('../controllers/visitController');
const prescriptionController = require('../controllers/prescriptionController');
const documentController = require('../controllers/documentController');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

router.post('/', patientController.createPatient);
router.get('/', patientController.getAllPatients);
router.get('/:id', patientController.getPatientById);
router.put('/:id', patientController.updatePatient);

// Nested routes for convenience matching spec:
// GET /api/patients/:id/visits
// GET /api/patients/:id/prescriptions
// GET /api/patients/:id/documents
router.get('/:id/visits', visitController.getPatientVisits);
router.get('/:id/prescriptions', prescriptionController.getPatientPrescriptions);
router.get('/:id/documents', documentController.getPatientDocuments);

module.exports = router;
