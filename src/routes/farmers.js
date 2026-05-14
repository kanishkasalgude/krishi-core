const { Router } = require('express');
const controller = require('../controllers/farmerController');

const router = Router();

router.get('/', controller.getAllFarmers);
router.get('/:id', controller.getFarmerById);
router.get('/:id/claims', controller.getFarmerClaims);

module.exports = router;
