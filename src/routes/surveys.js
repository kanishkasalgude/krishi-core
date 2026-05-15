const { Router } = require('express');
const controller = require('../controllers/surveyController');
const upload = require('../middleware/upload');

const router = Router();

router.get('/debug/latest-surveys', controller.getLatestSurveys);
router.get('/', controller.getAllSurveys);
router.get('/queue', controller.getSahayakQueue);
router.get('/summary', controller.getDashboardSummary);
router.get('/:id', controller.getSurveyById);
router.get('/:id/report', controller.generateReport);
router.get('/:id/grievances', controller.getGrievanceLinkage);
router.post('/', upload.array('files', 10), controller.submitSurvey);
router.patch('/:id/action', controller.performAction);

module.exports = router;
