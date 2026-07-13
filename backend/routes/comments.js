const router = require('express').Router({ mergeParams: true });
const comment = require('../controllers/commentController');
const { authMiddleware } = require('../middleware/auth');

// GET /api/blogs/:blogId/comments
router.get('/:blogId/comments', comment.list);

// POST /api/blogs/:blogId/comments
router.post('/:blogId/comments', authMiddleware, comment.create);

// DELETE /api/comments/:id (映射到 app.js 中额外挂载)
module.exports = router;

// 单独处理 DELETE（需要不带 :blogId 前缀的路由）
const deleteRouter = require('express').Router();
deleteRouter.delete('/:id', authMiddleware, comment.remove);
module.exports.deleteRouter = deleteRouter;
