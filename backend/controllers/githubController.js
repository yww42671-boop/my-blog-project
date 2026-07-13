const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const REDIRECT_URI = '/api/auth/github/callback';
const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

// Step 1: 跳转到 GitHub 授权页
exports.redirect = (req, res) => {
  if (!CLIENT_ID) {
    return res.status(500).send('❌ 未配置 GITHUB_CLIENT_ID，请在 .env 中填写');
  }
  const url =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(BASE_URL + REDIRECT_URI)}` +
    `&scope=read:user`;
  res.redirect(url);
};

// Step 2: GitHub 回调 — 用 code 换 token → 拿用户信息 → 登录/注册
exports.callback = async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('缺少授权码');
  }

  try {
    // 1. code → access_token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: BASE_URL + REDIRECT_URI,
      }),
    });
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return res.status(400).send('GitHub 授权失败：' + (tokenData.error_description || tokenData.error));
    }

    // 2. access_token → 用户信息
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const githubUser = await userRes.json();

    const githubId = String(githubUser.id);
    const username = githubUser.login;
    const nickname = githubUser.name || githubUser.login;
    const avatar = githubUser.avatar_url;
    const bio = githubUser.bio;

    // 3. 查找或创建用户
    const [rows] = await pool.query(
      'SELECT id, username, nickname, avatar FROM users WHERE github_id = ?',
      [githubId]
    );

    let user;
    if (rows.length > 0) {
      user = rows[0];
      // 更新头像/昵称
      await pool.query(
        'UPDATE users SET nickname = ?, avatar = ? WHERE id = ?',
        [nickname, avatar, user.id]
      );
    } else {
      // 检查用户名是否被占用，被占则追加后缀
      let finalUsername = username;
      const [dup] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
      if (dup.length > 0) {
        finalUsername = username + '_gh';
      }
      const [result] = await pool.query(
        'INSERT INTO users (username, password, nickname, avatar, bio, github_id) VALUES (?, ?, ?, ?, ?, ?)',
        [finalUsername, '', nickname, avatar, bio, githubId]
      );
      user = { id: result.insertId, username: finalUsername, nickname, avatar };
    }

    // 4. 签发 JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, nickname: user.nickname },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 5. 重定向回前端，带上 token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    res.redirect(`${frontendUrl}/login?token=${token}`);
  } catch (err) {
    console.error('GitHub OAuth 错误:', err);
    res.status(500).send('GitHub 登录失败');
  }
};
