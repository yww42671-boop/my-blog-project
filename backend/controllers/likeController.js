const pool = require('../config/db');

// 需登录：点赞/取消点赞（toggle）
exports.toggle = async (req, res) => {
  const { blogId } = req.params;

  try {
    // 验证博客存在
    const [blog] = await pool.query('SELECT id FROM blogs WHERE id = ?', [blogId]);
    if (blog.length === 0) {
      return res.status(404).json({ message: '文章不存在' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM likes WHERE blog_id = ? AND user_id = ?',
      [blogId, req.user.id]
    );

    if (existing.length > 0) {
      // 取消点赞
      await pool.query('DELETE FROM likes WHERE id = ?', [existing[0].id]);
      const [count] = await pool.query('SELECT COUNT(*) AS count FROM likes WHERE blog_id = ?', [blogId]);
      res.json({ liked: false, like_count: count[0].count });
    } else {
      // 点赞
      await pool.query('INSERT INTO likes (blog_id, user_id) VALUES (?, ?)', [blogId, req.user.id]);
      const [count] = await pool.query('SELECT COUNT(*) AS count FROM likes WHERE blog_id = ?', [blogId]);
      res.json({ liked: true, like_count: count[0].count });
    }
  } catch (err) {
    console.error('点赞操作错误:', err);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 需登录：获取当前用户对某文章的点赞状态
exports.status = async (req, res) => {
  const { blogId } = req.params;
  try {
    const [existing] = await pool.query(
      'SELECT id FROM likes WHERE blog_id = ? AND user_id = ?',
      [blogId, req.user.id]
    );
    const [count] = await pool.query('SELECT COUNT(*) AS count FROM likes WHERE blog_id = ?', [blogId]);
    res.json({ liked: existing.length > 0, like_count: count[0].count });
  } catch (err) {
    console.error('获取点赞状态错误:', err);
    res.status(500).json({ message: '服务器内部错误' });
  }
};
