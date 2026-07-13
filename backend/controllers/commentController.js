const pool = require('../config/db');

// 公开：获取文章的评论列表
exports.list = async (req, res) => {
  const { blogId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.content, c.parent_id, c.created_at,
              u.id AS user_id, u.nickname AS user_name
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.blog_id = ?
       ORDER BY c.created_at ASC`,
      [blogId]
    );
    res.json({ comments: rows });
  } catch (err) {
    console.error('获取评论错误:', err);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 需登录：发表评论
exports.create = async (req, res) => {
  const { blogId } = req.params;
  const { content, parent_id } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: '评论内容不能为空' });
  }

  try {
    // 验证博客存在
    const [blog] = await pool.query('SELECT id FROM blogs WHERE id = ?', [blogId]);
    if (blog.length === 0) {
      return res.status(404).json({ message: '文章不存在' });
    }

    const [result] = await pool.query(
      'INSERT INTO comments (blog_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)',
      [blogId, req.user.id, content.trim(), parent_id || null]
    );

    res.status(201).json({
      message: '评论成功',
      comment: {
        id: result.insertId,
        content: content.trim(),
        parent_id: parent_id || null,
        user_id: req.user.id,
        user_name: req.user.nickname,
      },
    });
  } catch (err) {
    console.error('发表评论错误:', err);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 需登录：删除评论（仅本人）
exports.remove = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT user_id FROM comments WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: '评论不存在' });
    }
    if (rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: '无权删除此评论' });
    }

    // 先删除子回复
    await pool.query('DELETE FROM comments WHERE parent_id = ?', [id]);
    await pool.query('DELETE FROM comments WHERE id = ?', [id]);
    res.json({ message: '删除成功' });
  } catch (err) {
    console.error('删除评论错误:', err);
    res.status(500).json({ message: '服务器内部错误' });
  }
};
