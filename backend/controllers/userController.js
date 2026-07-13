const pool = require('../config/db');

exports.getMe = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, nickname, avatar, bio, createdAt FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('获取用户信息错误:', err);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

exports.updateProfile = async (req, res) => {
  const { nickname, avatar, bio } = req.body;
  try {
    await pool.query(
      'UPDATE users SET nickname = COALESCE(?, nickname), avatar = COALESCE(?, avatar), bio = COALESCE(?, bio) WHERE id = ?',
      [nickname, avatar, bio, req.user.id]
    );
    res.json({ message: '更新成功' });
  } catch (err) {
    console.error('更新用户信息错误:', err);
    res.status(500).json({ message: '服务器内部错误' });
  }
};
