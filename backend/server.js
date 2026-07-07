require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2'); // ✨ 核心：必须在顶部加上这一行，把 mysql 库引进来！
// (注意：如果你之前安装的是旧版 mysql，就把上面这行换成 const mysql = require('mysql');)

// 1. 🚀 创造 app 实例
const app = express();

// 2. 🛠️ 配置中间件
app.use(cors());         // 允许跨域
app.use(express.json()); // 解析 JSON 数据

// 3. 📥 接下来才是你原本的数据库配置（也就是第 13 行开始的内容）：
// const pool = mysql.createPool({ ...
// 创建数据库连接池
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 测试数据库连接
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ 数据库连接失败:', err.message);
        return;
    }
    console.log('🚀 数据库连接成功！当前已成功对接 my_blog 数据库。');
    connection.release(); // 释放连接
});
// ==================== 用户注册接口 ====================
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;

    // 1. 基础验证：确保账号密码都不为空
    if (!username || !password) {
        return res.status(400).json({ message: '账号和密码不能为空！' });
    }

    // 2. 检查用户名是否已被注册
    const checkUserSql = 'SELECT * FROM users WHERE username = ?';
    pool.query(checkUserSql, [username], (err, results) => {
        if (err) {
            console.error('数据库查询错误:', err);
            return res.status(500).json({ message: '服务器内部错误' });
        }

        if (results.length > 0) {
            return res.status(400).json({ message: '该用户名已被占用，换一个试试吧！' });
        }

        // 3. 用户名可用，将新用户写入数据库
        // (实际开发中密码需要加密，咱们先用明文把流程跑通，后面再优化加密)
        const insertUserSql = 'INSERT INTO users (username, password) VALUES (?, ?)';
        pool.query(insertUserSql, [username, password], (insertErr, insertResults) => {
            if (insertErr) {
                console.error('数据库插入错误:', insertErr);
                return res.status(500).json({ message: '注册失败，请稍后再试' });
            }

            // 4. 注册成功响应
            res.status(201).json({ 
                message: '恭喜你，注册成功！', 
                userId: insertResults.insertId 
            });
        });
    });
});
// ================ 用户登录接口 ================
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // 1. 基础验证
  if (!username || !password) {
    return res.status(400).json({ message: '账号和密码不能为空' });
  }

  // 2. 去数据库查询用户是否存在（这里用你之前查到的 my_blog 数据库表）
  const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
  pool.query(sql, [username, password], (err, results) => {
    if (err) {
      console.error('数据库查询失败:', err);
      return res.status(500).json({ message: '服务器内部错误' });
    }

    if (results.length > 0) {
      // 找到了，登录成功！
      return res.json({ message: '登录成功！欢迎回来', user: results[0] });
    } else {
      // 没找到或密码不对
      return res.status(401).json({ message: '用户名或密码错误' });
    }
  });
});
// 基础路由测试
app.get('/', (req, res) => {
    res.send('博客后端服务器正在运行中...');
});

// 启动服务器
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✨ 后端服务已在 http://localhost:${PORT} 成功启动！`);
});