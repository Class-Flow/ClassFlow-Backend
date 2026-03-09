const router = require('express').Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', auth, authController.getMe);
router.post('/aadhar-login', authController.requestAadharOtp);
router.post('/aadhar-verify', authController.verifyAadharOtp);

module.exports = router;
