const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/auth');
const buildingController = require('../controllers/buildingController');

// /api/departments
router.get('/', buildingController.listDepartments);
router.post('/', authorize('Admin'), buildingController.createDepartment);
router.put('/:id', authorize('Admin'), buildingController.updateDepartment);
router.delete('/:id', authorize('Admin'), buildingController.deleteDepartment);

module.exports = router;
