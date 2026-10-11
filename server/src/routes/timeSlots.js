const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/auth');
const timeSlotController = require('../controllers/timeSlotController');

// /api/time-slots
router.get('/', timeSlotController.listTimeSlots);
router.post('/', authorize('Admin'), timeSlotController.createTimeSlot);
router.put('/:id', authorize('Admin'), timeSlotController.updateTimeSlot);
router.delete('/:id', authorize('Admin'), timeSlotController.deleteTimeSlot);

module.exports = router;
