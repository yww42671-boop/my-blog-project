const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.getConnection((err, conn) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err.message);
    return;
  }
  console.log('🚀 数据库连接成功！');
  conn.release();
});

module.exports = pool.promise();
