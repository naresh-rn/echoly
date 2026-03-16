const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { auth } = require('../middleware/auth');

router.get('/history', auth, projectController.getHistory);
router.delete('/history', auth, projectController.deleteAllHistory);

router.put('/projects/:projectId/asset', auth, projectController.updateAsset);
router.delete('/projects/:id', auth, projectController.deleteProject);
router.delete('/projects/:projectId/asset/:platform', auth, projectController.deleteAsset);


module.exports = router;
