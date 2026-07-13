const router = require('express').Router();
const blog = require('../controllers/blogController');
const { authMiddleware } = require('../middleware/auth');

// 注意：精确路由必须放在 /:id 之前
router.get('/my/all', authMiddleware, blog.myBlogs);

// 公开
router.get('/', blog.list);
router.get('/:id', blog.getById);

// 需登录
router.post('/', authMiddleware, blog.create);
router.put('/:id', authMiddleware, blog.update);
router.delete('/:id', authMiddleware, blog.remove);

module.exports = router;
