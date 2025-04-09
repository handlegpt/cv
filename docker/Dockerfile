# 使用Node.js 18作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    postgresql-client \
    openssl \
    git

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装所有依赖
RUN npm install

# 复制项目文件
COPY . .

# 生成Prisma客户端
RUN npx prisma generate

# 构建应用
RUN npm run build

# 创建必要的目录
RUN mkdir -p uploads

# 暴露端口
EXPOSE 3000

# 启动脚本
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

# 启动应用
CMD ["/start.sh"]
