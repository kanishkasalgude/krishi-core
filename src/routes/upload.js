const { Router } = require('express');
const upload = require('../middleware/upload');
const controller = require('../controllers/uploadController');

const router = Router();

router.post('/', upload.array('files', 10), controller.uploadFiles);

module.exports = router;
