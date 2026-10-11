const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/auth');
const resourcePolicyController = require('../controllers/resourcePolicyController');

// /api/resource-policies
router.get('/', resourcePolicyController.listResourcePolicies);
router.post('/', authorize('Admin'), resourcePolicyController.createResourcePolicy);
router.put('/:id', authorize('Admin'), resourcePolicyController.updateResourcePolicy);
router.delete('/:id', authorize('Admin'), resourcePolicyController.deleteResourcePolicy);

module.exports = router;
