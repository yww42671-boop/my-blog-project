const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const blogRoutes = require('./routes/blogs');
const commentRoutes = require('./routes/comments');
const likeRoutes = require('./routes/likes');
const commentDeleteRouter = require('./routes/comments').deleteRouter;

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 路由挂载
app.use('/api', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/blogs', commentRoutes);
app.use('/api/blogs', likeRoutes);
app.use('/api/comments', commentDeleteRouter); // DELETE /api/comments/:id

// 健康检查
app.get('/', (req, res) => {
  res.send('博客后端服务器正在运行中...');
});

module.exports = app;
