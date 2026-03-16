const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.get('/me', auth, authController.getMe);
router.delete('/delete-account', auth, authController.deleteAccount);
router.put('/brand-voice', auth, authController.updateBrandVoice);
router.put('/update-password', auth, authController.updatePassword);

module.exports = router;
