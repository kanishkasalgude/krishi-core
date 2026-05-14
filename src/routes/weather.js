const { Router } = require('express');
const controller = require('../controllers/weatherController');

const router = Router();

router.get('/', controller.getWeather);

module.exports = router;
