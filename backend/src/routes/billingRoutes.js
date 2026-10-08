const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

router.post('/', billingController.createBill);
router.get('/', billingController.getAllBills);
router.get('/calculate-fee', billingController.calculateFee);
router.get('/:id', billingController.getBillById);
router.post('/:id/payments', billingController.addPayment);

module.exports = router;
