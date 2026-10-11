const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/auth');
const buildingController = require('../controllers/buildingController');

// /api/buildings
router.get('/', buildingController.listBuildings);
router.post('/', authorize('Admin'), buildingController.createBuilding);
router.put('/:id', authorize('Admin'), buildingController.updateBuilding);
router.delete('/:id', authorize('Admin'), buildingController.deleteBuilding);

module.exports = router;
