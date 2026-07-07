# my-blog-project

## 项目目标
本项目是教学项目第一阶段的产出，目标是完成博客网站的基本设计与项目框架搭建，为后续从0到1开发打基础。

## 技术栈
- 前端：React（可替换为Vue或Svelte）
- 后端：Node.js + Express（可替换为Flask或Django）
- 数据库：MySQL / SQLite
- 版本管理：Git + GitHub
- 部署：Vercel / Netlify / 阿里云服务器

## 项目模块设计
### 用户模块
- 用户注册、登录、个人信息管理

### 博客模块
- 博客列表
- 博客详情
- 发表博客

## 数据库设计
### 用户表 (users)
| 字段        | 类型          | 描述        |
| ----------- | ------------ | ---------- |
| id          | int          | 主键       |
| username    | varchar(50)  | 用户名     |
| password    | varchar(100) | 密码       |
| email       | varchar(100) | 邮箱       |
| create_time | datetime     | 创建时间   |

### 博客表 (blogs)
| 字段        | 类型          | 描述         |
| ----------- | ------------ | ----------- |
| id          | int          | 主键        |
| author_id   | int          | 用户ID外键  |
| title       | varchar(100) | 博客标题    |
| content     | text         | 博客内容    |
| create_time | datetime     | 创建时间    |
| update_time | datetime     | 更新时间    |

## 下一步计划
1. 完成基础前端页面和路由
2. 完成后端API骨架
3. 搭建数据库并连接前后端
4. 开发基础功能（用户注册/登录、发表博客）
5. 开始探索进阶功能（评论、点赞、agent探索等）

## GitHub仓库
请将此项目 push 至 GitHub，方便 mentor 验收。