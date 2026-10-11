const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/auth');
const academicTermController = require('../controllers/academicTermController');

// /api/academic-terms
router.get('/', academicTermController.listAcademicTerms);
router.post('/', authorize('Admin'), academicTermController.createAcademicTerm);
router.put('/:id', authorize('Admin'), academicTermController.updateAcademicTerm);
router.delete('/:id', authorize('Admin'), academicTermController.deleteAcademicTerm);

module.exports = router;
