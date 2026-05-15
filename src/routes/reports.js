const { Router } = require('express');
const controller = require('../controllers/reportController');

const router = Router();

router.get('/', controller.getAllReports);
router.get('/:id', controller.getReportById);

module.exports = router;
