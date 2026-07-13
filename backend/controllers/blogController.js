const pool = require('../config/db');

// 公开：已发布文章列表（带分页）
exports.list = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  const sort = req.query.sort || 'latest'; // latest | popular

  let orderClause = 'ORDER BY b.created_at DESC';
  if (sort === 'popular') {
    orderClause = 'ORDER BY like_count DESC, comment_count DESC, b.created_at DESC';
  }

  try {
    const [countRows] = await pool.query(
      "SELECT COUNT(*) AS total FROM blogs WHERE status = 'published'"
    );
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT b.id, b.title, SUBSTRING(b.content, 1, 200) AS excerpt, b.tags,
              b.status, b.created_at, b.updated_at,
              u.nickname AS author_name,
              (SELECT COUNT(*) FROM likes WHERE blog_id = b.id) AS like_count,
              (SELECT COUNT(*) FROM comments WHERE blog_id = b.id) AS comment_count
       FROM blogs b
       JOIN users u ON b.author_id = u.id
       WHERE b.status = 'published'
       ${orderClause}
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.json({
      blogs: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('获取博客列表错误:', err);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 公开：获取单篇文章详情
exports.getById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT b.*, u.nickname AS author_name,
              (SELECT COUNT(*) FROM likes WHERE blog_id = b.id) AS like_count,
              (SELECT COUNT(*) FROM comments WHERE blog_id = b.id) AS comment_count
       FROM blogs b
       JOIN users u ON b.author_id = u.id
       WHERE b.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: '文章不存在' });
    }

    res.json({ blog: rows[0] });
  } catch (err) {
    console.error('获取文章详情错误:', err);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 需登录：创建文章
exports.create = async (req, res) => {
  const { title, content, tags, status } = req.body;
  if (!title || !content) {
    return res.status(400).json({ message: '标题和内容不能为空' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO blogs (title, content, tags, status, author_id) VALUES (?, ?, ?, ?, ?)',
      [title, content, JSON.stringify(tags || []), status || 'published', req.user.id]
    );

    res.status(201).json({
      message: '发布成功',
      blog: { id: result.insertId, title, content, tags, status: status || 'published' },
    });
  } catch (err) {
    console.error('创建文章错误:', err);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 需登录：更新文章（仅作者）
exports.update = async (req, res) => {
  const { id } = req.params;
  const { title, content, tags, status } = req.body;

  try {
    const [rows] = await pool.query('SELECT author_id FROM blogs WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: '文章不存在' });
    }
    if (rows[0].author_id !== req.user.id) {
      return res.status(403).json({ message: '无权编辑此文章' });
    }

    await pool.query(
      'UPDATE blogs SET title = COALESCE(?, title), content = COALESCE(?, content), tags = COALESCE(?, tags), status = COALESCE(?, status) WHERE id = ?',
      [title, content, tags ? JSON.stringify(tags) : null, status, id]
    );

    res.json({ message: '更新成功' });
  } catch (err) {
    console.error('更新文章错误:', err);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 需登录：删除文章（仅作者）
exports.remove = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query('SELECT author_id FROM blogs WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: '文章不存在' });
    }
    // 作者或管理员可删
    if (rows[0].author_id !== req.user.id) {
      return res.status(403).json({ message: '无权删除此文章' });
    }

    await pool.query('DELETE FROM blogs WHERE id = ?', [id]);
    res.json({ message: '删除成功' });
  } catch (err) {
    console.error('删除文章错误:', err);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 需登录：获取自己的文章（含草稿）
exports.myBlogs = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.id, b.title, SUBSTRING(b.content, 1, 200) AS excerpt, b.tags,
              b.status, b.created_at, b.updated_at,
              (SELECT COUNT(*) FROM likes WHERE blog_id = b.id) AS like_count,
              (SELECT COUNT(*) FROM comments WHERE blog_id = b.id) AS comment_count
       FROM blogs b
       WHERE b.author_id = ?
       ORDER BY b.updated_at DESC`,
      [req.user.id]
    );
    res.json({ blogs: rows });
  } catch (err) {
    console.error('获取我的文章错误:', err);
    res.status(500).json({ message: '服务器内部错误' });
  }
};
