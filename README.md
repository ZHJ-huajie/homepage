# Node.js PM2 应用部署指南

本项目使用 PM2 进行 Node.js 应用程序的进程管理和自动启动配置。PM2 是一个守护进程管理器，可以帮助您管理和保持应用程序 24/7 在线。

## 安装和运行

### 前置要求
- Node.js (v14+)
- npm 或 yarn
- PM2 (用于生产环境)

### 全局依赖安装

1. 安装 Node.js
   - 从 [Node.js 官网](https://nodejs.org/) 下载并安装
   - 或使用 nvm 安装（推荐）：
     ```bash
     # Windows
     nvm install 14.17.0
     nvm use 14.17.0

     # Linux/Mac
     nvm install 14
     nvm use 14
     ```

2. 安装 PM2
   ```bash
   npm install -g pm2
   ```

3. 安装 cross-env（用于跨平台环境变量设置）
   ```bash
   npm install -g cross-env
   ```

### 项目安装

1. 克隆项目
   ```bash
   git clone [项目地址]
   cd [项目目录]
   ```

2. 安装依赖
   ```bash
   npm install
   ```

## 开发环境

1. 启动开发服务器
   ```bash
   npm run dev
   ```

2. 查看运行状态
   ```bash
   npm run status
   ```

## 生产环境部署

### Windows 系统

1. 以管理员身份运行 PowerShell，执行：
   ```powershell
   # 安装 PM2 Windows 启动器
   npm install -g pm2-windows-startup
   pm2-startup install
   
   # 启动应用
   npm run start
   
   # 保存当前进程列表
   pm2 save
   ```

2. 验证安装
   ```bash
   # 查看运行状态
   npm run status
   
   # 查看日志
   npm run logs
   ```

### Linux 系统

1. 设置开机自启动
   ```bash
   # 生成启动脚本（可能需要 sudo）
   sudo npm run startup
   
   # 启动应用
   npm run start
   
   # 保存进程列表
   pm2 save
   ```

2. 验证安装
   ```bash
   # 检查 PM2 状态
   systemctl status pm2-$USER
   
   # 查看应用状态
   pm2 status
   ```

### Docker 环境

1. 构建镜像
   ```bash
   docker build -t your-app-name .
   ```

2. 运行容器
   ```bash
   docker run -d \
     -p 3000:3000 \
     --name your-app-name \
     --restart unless-stopped \
     your-app-name
   ```

## 项目配置

### 环境变量
项目使用 `.env` 文件管理不同环境的配置：

- `.env.development` - 开发环境
  ```env
  NODE_ENV=development
  PORT=3000
  ```

- `.env.production` - 生产环境
  ```env
  NODE_ENV=production
  PORT=3003
  ```

### PM2 配置
`ecosystem.config.js` 文件：