const express = require('express');
const {
  getLowStockAlerts,
  updateQuantity,
  getInventoryStats
} = require('../controllers/inventoryController');
const { adminProtect } = require('../middleware/auth');

const router = express.Router();

router.get('/alerts', adminProtect, getLowStockAlerts);
router.get('/stats', adminProtect, getInventoryStats);
router.patch('/:id/quantity', adminProtect, updateQuantity);

module.exports = router;