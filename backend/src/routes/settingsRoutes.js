const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authenticateToken = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');

// Public / Global: fetch clinic branding & contact details
router.get('/', settingsController.getSettings);

// ADMIN ONLY: Update clinic details & logo
router.put('/', authenticateToken, requireRole('ADMIN'), settingsController.updateSettings);
router.post(
  '/logo',
  authenticateToken,
  requireRole('ADMIN'),
  settingsController.uploadLogoMiddleware,
  settingsController.uploadLogo
);
router.delete('/logo', authenticateToken, requireRole('ADMIN'), settingsController.deleteLogo);

module.exports = router;
