const { Router } = require('express');
const upload = require('../middleware/upload');
const controller = require('../controllers/uploadController');

const router = Router();

router.post('/', upload.any(), controller.uploadFiles);

module.exports = router;
