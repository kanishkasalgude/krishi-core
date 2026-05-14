const { Router } = require('express');
const controller = require('../controllers/claimController');
const upload = require('../middleware/upload');

const router = Router();

router.get('/', controller.getAllClaims);
router.get('/summary', controller.getClaimsSummary);
router.get('/:id', controller.getClaimById);
// ── BUG-10: multer middleware attached so claim images/videos are actually processed ──
router.post('/', upload.array('files', 10), controller.createClaim);
router.patch('/:id', controller.updateClaimStatus);

module.exports = router;
