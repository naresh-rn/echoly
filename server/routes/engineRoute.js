const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { auth } = require('../middleware/auth');
const engineController = require('../controllers/engineController');

const tempDir = 'temp_uploads';
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

// FIX FOR GROQ VALIDATION BUG
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, tempDir + '/');
    },
    filename: function (req, file, cb) {
        // Must preserve the original extension so Groq's validation passes
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
const upload = multer({ storage: storage });

router.post('/repurpose-all', auth, upload.single('file'), engineController.repurposeAll);
router.post('/repurpose-single', auth, engineController.repurposeSingle);
router.post('/generate-image-prompt', auth, engineController.getImagePrompt);
router.post('/generate-image', auth, engineController.makeImage);

module.exports = router;
