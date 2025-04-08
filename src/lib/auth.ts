import { compare, hash } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import redis from './redis';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from "@auth/prisma-adapter";

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
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  
  return sign(
    { userId },
    secret,
    { expiresIn: expiresIn as string }
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

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = verify(token, secret) as { userId: string };
    return decoded.userId;
  } catch (error) {
    return null;
  }
};

// 撤销JWT令牌
export const revokeToken = async (token: string): Promise<void> => {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const decoded = verify(token, secret) as { exp: number };
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
export async function loginUser(data: LoginInput) {
  const user = await validateUser(data.email, data.password);
  if (!user) {
    throw new Error('邮箱或密码错误');
  }

  const token = generateToken(user.id);
  return { user, token };
}

// 验证用户
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

// NextAuth 配置
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("请输入邮箱和密码");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user) {
          throw new Error("用户不存在");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("密码错误");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
}; 