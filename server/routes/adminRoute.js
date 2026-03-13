const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { adminAuth } = require('../middleware/auth');

router.get('/users', adminAuth, adminController.getAllUsers);
router.get('/projects', adminAuth, adminController.getAllProjects);

module.exports = router;
