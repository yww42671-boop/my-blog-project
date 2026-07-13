require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✨ 后端服务已在 http://localhost:${PORT} 成功启动！`);
});
