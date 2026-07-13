# 📓 My Blog Project

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" />
  <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />
  <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" />
</p>

一个桌面模拟器风格的**个人博客系统**，整合了美食点评、旅行日记、游戏推荐、笔记与博客发布等功能。

---

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| **前端框架** | React 19 |
| **后端框架** | Express 5 (Node.js) |
| **数据库** | MySQL（小皮面板 phpStudy） |
| **认证** | JWT + bcryptjs |
| **3D 渲染** | Three.js（旅行地球板块） |
| **版本管理** | Git + GitHub |

## 📁 项目结构

```
my-blog-project/
├── frontend/              # React 前端
│   └── src/
│       ├── components/    # 页面组件
│       │   ├── MainInterface.jsx   # 桌面热点主界面
│       │   ├── LoginForm.jsx       # 登录/注册
│       │   ├── NotesPage.jsx       # 本地笔记
│       │   ├── BlogPage.jsx        # 博客发布（API）
│       │   ├── FoodPage.jsx        # 美食点评
│       │   ├── TravelPage.jsx      # 旅行日记（3D 地球）
│       │   ├── GamePage.jsx        # 游戏推荐
│       │   ├── CommentSection.jsx  # 评论区
│       │   └── LikeButton.jsx      # 点赞组件
│       ├── AuthContext.js  # JWT 认证上下文
│       └── api.js          # 统一 API 客户端
│
├── backend/               # Express 服务端
│   ├── server.js           # 入口
│   ├── app.js              # 路由挂载
│   ├── config/db.js        # MySQL 连接池
│   ├── middleware/auth.js  # JWT 鉴权
│   ├── routes/             # 路由层
│   └── controllers/        # 逻辑层
│       ├── authController.js    # 注册/登录
│       ├── blogController.js    # 博客 CRUD
│       ├── commentController.js # 评论
│       └── likeController.js    # 点赞
│
└── sucai/                 # 静态资源
```

## ✨ 功能模块

### 👤 用户模块
- 注册 / 登录（bcrypt 密码加密 + JWT 令牌）
- 昵称、头像、个人简介
- 登录状态持久化（localStorage + Context）

### 📝 博客模块
- Markdown 编辑器（实时预览）
- 文章发布 / 草稿 / 编辑 / 删除
- 标签管理，分页浏览

### 💬 评论 & 点赞
- 评论区（支持嵌套回复）
- 点赞 toggle（乐观更新）

### 📓 本地笔记
- 与博客并存的本地笔记功能
- 纯浏览器存储（localStorage），无需网络

### 🍰 美食 / 🗺️ 旅行 / 🎮 游戏
- 美食点评（评分 + 标签 + 图片）
- 旅行日记（Three.js 3D 地球 + 地理编码）
- 游戏推荐（平台 + 状态 + 评分 + 时长）

## 🚀 快速启动

```bash
# 后端
cd backend
npm install
node server.js          # http://localhost:5000

# 前端
cd frontend
npm install
npm start               # http://localhost:3000
```

## 🗄️ 数据库（小皮面板 phpStudy）
- 数据库名：`my_blog`
- 表：`users` / `blogs` / `comments` / `likes`
