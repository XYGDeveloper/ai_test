# 全栈待办事项网站 (Fullstack Todo Website)

一个前后端分离的待办事项（Todo）网站示例项目。

- **前端** (`client/`)：React 19 + TypeScript + Vite
- **后端** (`server/`)：Node.js + Express 5 + SQLite（Node 内置 `node:sqlite`，无需原生依赖）
- **测试**：Vitest + Supertest（后端 API），Vitest + Testing Library（前端组件）
- **CI**：GitHub Actions 自动运行 lint、测试和构建

## 功能

- 添加 / 删除任务
- 标记完成 / 未完成
- 按 全部 / 未完成 / 已完成 筛选
- 一键清除已完成任务
- 数据持久化到 SQLite 文件

## 环境要求

- Node.js >= 22.13（推荐 24）

## 快速开始

```bash
npm run install:all     # 安装前后端依赖

# 开发模式（两个终端）
npm run dev:server      # 后端 http://localhost:3001
npm run dev:client      # 前端 http://localhost:5173（/api 自动代理到后端）

# 生产模式：构建前端，由后端统一托管
npm run build
npm start               # 打开 http://localhost:3001
```

## 测试

```bash
npm test                # 运行后端 + 前端全部测试
npm run lint            # 前端代码检查
```

## 配置（环境变量）

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `3001` | 后端端口 |
| `DB_FILE` | `server/data.db` | SQLite 数据库文件路径 |
| `STATIC_DIR` | `client/dist` | 前端构建产物目录 |

## REST API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/health` | 健康检查 |
| `GET` | `/api/todos` | 获取全部任务（最新在前） |
| `POST` | `/api/todos` | 创建任务，body: `{ "title": "..." }` |
| `PATCH` | `/api/todos/:id` | 更新任务，body: `{ "title"?: "...", "completed"?: true }` |
| `DELETE` | `/api/todos/:id` | 删除任务 |
| `DELETE` | `/api/todos?completed=true` | 清除所有已完成任务 |

错误统一返回 `{ "error": "..." }`，并带相应 HTTP 状态码（400 / 404 / 500）。

## 目录结构

```
.
├── client/                 # 前端
│   └── src/
│       ├── App.tsx         # 主界面
│       ├── App.test.tsx    # 组件测试
│       └── api.ts          # API 封装
├── server/                 # 后端
│   ├── src/
│   │   ├── app.js          # Express 应用与路由
│   │   ├── db.js           # SQLite 初始化
│   │   ├── todos.js        # 数据访问层
│   │   └── index.js        # 启动入口
│   └── test/app.test.js    # API 测试
└── .github/workflows/ci.yml
```
