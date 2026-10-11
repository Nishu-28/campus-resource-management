const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/auth');
const userController = require('../controllers/userController');

// Profile routes (any authenticated user)
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/change-password', userController.changePassword);

// Admin-only routes
router.get('/', authorize('Admin'), userController.listUsers);
router.post('/', authorize('Admin'), userController.createUser);
router.put('/:id', authorize('Admin'), userController.updateUser);
router.put('/:id/toggle-active', authorize('Admin'), userController.toggleActive);

module.exports = router;
