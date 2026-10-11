const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const { authorize } = require('../middleware/auth');

router.get('/categories', resourceController.getCategories);
router.get('/features', resourceController.getFeatures);
router.get('/:id/bookings', resourceController.getResourceBookings);
router.get('/:id', resourceController.getResource);
router.get('/', resourceController.listResources);

router.post('/', authorize('Admin'), resourceController.createResource);
router.put('/:id', authorize('Admin'), resourceController.updateResource);
router.delete('/:id', authorize('Admin'), resourceController.deleteResource);

module.exports = router;
