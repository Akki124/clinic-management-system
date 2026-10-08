const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

router.post('/upload', documentController.uploadMiddleware, documentController.uploadDocument);
router.get('/patient/:id', documentController.getPatientDocuments);

module.exports = router;
