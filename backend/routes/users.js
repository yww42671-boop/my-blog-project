const router = require('express').Router();
const user = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');

router.get('/me', authMiddleware, user.getMe);
router.put('/profile', authMiddleware, user.updateProfile);

module.exports = router;
