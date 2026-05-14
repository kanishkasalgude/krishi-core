const { Router } = require('express');
const controller = require('../controllers/claimController');

const router = Router();

router.get('/', controller.getAllClaims);
router.get('/summary', controller.getClaimsSummary);
router.get('/:id', controller.getClaimById);
router.post('/', controller.createClaim);
router.patch('/:id', controller.updateClaimStatus);

module.exports = router;
