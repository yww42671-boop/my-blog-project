const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

exports.register = async (req, res) => {
  const { username, password, nickname } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: '账号和密码不能为空' });
  }

  try {
    // 检查重复
    const [rows] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (rows.length > 0) {
      return res.status(400).json({ message: '该用户名已被占用' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const displayName = nickname || username;
    const [result] = await pool.query(
      'INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)',
      [username, hashed, displayName]
    );

    const token = jwt.sign(
      { id: result.insertId, username, nickname: displayName },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: '注册成功',
      token,
      user: { id: result.insertId, username, nickname: displayName },
    });
  } catch (err) {
    console.error('注册错误:', err);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: '账号和密码不能为空' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, username, nickname, password FROM users WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, nickname: user.nickname },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: '登录成功',
      token,
      user: { id: user.id, username: user.username, nickname: user.nickname },
    });
  } catch (err) {
    console.error('登录错误:', err);
    res.status(500).json({ message: '服务器内部错误' });
  }
};
