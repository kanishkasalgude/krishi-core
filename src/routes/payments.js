const { Router } = require('express');
const controller = require('../controllers/paymentController');

const router = Router();

router.get('/', controller.getAllPayments);
router.get('/:claimId', controller.getPaymentByClaim);

module.exports = router;
