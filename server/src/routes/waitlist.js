const express = require('express');
const router = express.Router();
const waitlistController = require('../controllers/waitlistController');

router.get('/', waitlistController.listWaitlist);
router.post('/', waitlistController.joinWaitlist);
router.delete('/:id', waitlistController.removeFromWaitlist);

module.exports = router;
