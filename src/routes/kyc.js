const { Router } = require('express');
const controller = require('../controllers/kycController');

const router = Router();

router.get('/', controller.getAllKyc);
router.get('/:farmerId', controller.getKycByFarmer);

module.exports = router;
