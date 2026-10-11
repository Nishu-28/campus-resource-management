const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/auth');
const auditLogController = require('../controllers/auditLogController');

router.get('/', authorize('Admin'), auditLogController.listAuditLogs);

module.exports = router;
