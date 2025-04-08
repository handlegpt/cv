import { compare, hash } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import { z } from 'zod';
import prisma from './prisma';
import redis from './redis';

// 用户注册验证模式
export const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(8, '密码至少需要8个字符'),
  name: z.string().optional(),
});

// 用户登录验证模式
export const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string(),
});

// 生成JWT令牌
export const generateToken = (userId: string): string => {
  return sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// 验证JWT令牌
export const verifyToken = async (token: string): Promise<string | null> => {
  try {
    // 检查令牌是否被撤销
    const isRevoked = await redis.get(`revoked_token:${token}`);
    if (isRevoked) {
      return null;
    }

    const decoded = verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
    return decoded.userId;
  } catch (error) {
    return null;
  }
};

// 撤销JWT令牌
export const revokeToken = async (token: string): Promise<void> => {
  const decoded = verify(token, process.env.JWT_SECRET || 'your-secret-key') as { exp: number };
  const ttl = decoded.exp - Math.floor(Date.now() / 1000);
  
  if (ttl > 0) {
    await redis.set(`revoked_token:${token}`, '1', 'EX', ttl);
  }
};

// 注册新用户
export const registerUser = async (data: z.infer<typeof registerSchema>) => {
  const { email, password, name } = data;
  
  // 检查邮箱是否已存在
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  
  if (existingUser) {
    throw new Error('该邮箱已被注册');
  }
  
  // 哈希密码
  const hashedPassword = await hash(password, 10);
  
  // 创建用户
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  });
  
  // 生成令牌
  const token = generateToken(user.id);
  
  return { user, token };
};

// 用户登录
export const loginUser = async (data: z.infer<typeof loginSchema>) => {
  const { email, password } = data;
  
  // 查找用户
  const user = await prisma.user.findUnique({
    where: { email },
  });
  
  if (!user) {
    throw new Error('用户不存在');
  }
  
  // 验证密码
  const isValid = await compare(password, user.password);
  
  if (!isValid) {
    throw new Error('密码错误');
  }
  
  // 生成令牌
  const token = generateToken(user.id);
  
  return { user, token };
};

// 获取当前用户
export const getCurrentUser = async (token: string) => {
  const userId = await verifyToken(token);
  
  if (!userId) {
    return null;
  }
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  
  return user;
}; 