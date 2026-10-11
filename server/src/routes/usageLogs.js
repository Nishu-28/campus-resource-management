const express = require('express');
const router = express.Router();
const usageLogController = require('../controllers/usageLogController');

router.get('/', usageLogController.listUsageLogs);
router.post('/', usageLogController.checkIn);
router.put('/:id/checkout', usageLogController.checkOut);

module.exports = router;
