#!/bin/sh

# 等待数据库就绪
echo "等待数据库就绪..."
while ! nc -z db 5432; do
  sleep 1
done
echo "数据库已就绪"

# 运行数据库迁移
echo "运行数据库迁移..."
npx prisma migrate deploy

# 启动应用
echo "启动应用..."
npm start 