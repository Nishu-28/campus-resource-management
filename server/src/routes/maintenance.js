const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/auth');
const maintenanceController = require('../controllers/maintenanceController');

router.get('/', maintenanceController.listMaintenanceLogs);
router.post('/', maintenanceController.reportIssue);
router.put('/:id', authorize('Admin'), maintenanceController.updateMaintenanceLog);

module.exports = router;
