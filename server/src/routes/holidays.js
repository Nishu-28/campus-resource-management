const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/auth');
const holidayController = require('../controllers/holidayController');

// /api/holidays
router.get('/', holidayController.listHolidays);
router.post('/', authorize('Admin'), holidayController.createHoliday);
router.put('/:id', authorize('Admin'), holidayController.updateHoliday);
router.delete('/:id', authorize('Admin'), holidayController.deleteHoliday);

module.exports = router;
