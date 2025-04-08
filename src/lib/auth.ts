import { compare, hash } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import { z } from 'zod';
import prisma from './prisma';
import redis from './redis';
import bcrypt from 'bcryptjs';

// 用户注册验证模式
export const registerSchema = z.object({
  name: z.string().min(2, '姓名至少需要2个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少需要6个字符'),
});

// 用户登录验证模式
export const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

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
export async function registerUser(data: RegisterInput) {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
    },
  });

  return user;
}

// 用户登录
export async function validateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return null;
  }

  return user;
}

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