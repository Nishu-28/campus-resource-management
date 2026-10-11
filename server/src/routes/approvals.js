const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/auth');
const approvalController = require('../controllers/approvalController');

router.get('/', authorize('Admin', 'HOD'), approvalController.listPendingApprovals);
router.post('/:bookingId', authorize('Admin', 'HOD'), approvalController.processApproval);

module.exports = router;
