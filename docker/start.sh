#!/bin/sh

# 确保脚本在错误时停止
set -e

# 等待数据库准备就绪
echo "等待数据库准备就绪..."
while ! nc -z db 5432; do
  sleep 1
done

# 等待 Redis 准备就绪
echo "等待 Redis 准备就绪..."
while ! nc -z redis 6379; do
  sleep 1
done

# 运行数据库迁移
echo "运行数据库迁移..."
npx prisma migrate deploy

# 启动应用
echo "启动应用..."
npm start 