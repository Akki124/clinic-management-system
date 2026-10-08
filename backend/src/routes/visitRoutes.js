const express = require('express');
const router = express.Router();
const visitController = require('../controllers/visitController');
const authenticateToken = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');

router.use(authenticateToken);

router.post('/', requireRole('ADMIN'), visitController.createVisit);
router.get('/:id', visitController.getVisitById);

module.exports = router;
