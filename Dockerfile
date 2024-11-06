# 使用 Node.js 18 Alpine 作为基础镜像
FROM docker.io/library/node:18-alpine

# 只安装必要的系统依赖
RUN apk add --no-cache curl

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装项目依赖
RUN npm install --production

# 复制项目文件
COPY . .

# 创建必要的目录
RUN mkdir -p data logs public/background

# 设置目录权限
RUN chown -R node:node /app

# 切换到非 root 用户
USER node

# 暴露端口
EXPOSE 3003

# 设置环境变量
ENV NODE_ENV=production \
    PORT=3003

# 启动应用
CMD ["npm", "start"]
