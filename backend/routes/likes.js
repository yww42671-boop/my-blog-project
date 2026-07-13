const router = require('express').Router({ mergeParams: true });
const like = require('../controllers/likeController');
const { authMiddleware } = require('../middleware/auth');

// POST /api/blogs/:blogId/like
router.post('/:blogId/like', authMiddleware, like.toggle);

// GET /api/blogs/:blogId/like-status
router.get('/:blogId/like-status', authMiddleware, like.status);

module.exports = router;
