const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

router.get('/time-slots', bookingController.getTimeSlots);
router.get('/approved', bookingController.listApprovedBookings);
router.get('/', bookingController.listBookings);
router.post('/recurring', bookingController.createRecurringBooking);
router.post('/', bookingController.createBooking);
router.put('/:id/cancel', bookingController.cancelBooking);

module.exports = router;
