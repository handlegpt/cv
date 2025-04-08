import { NextRequest, NextResponse } from 'next/server';
import { loginUser, loginSchema } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证请求数据
    const result = loginSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: '无效的请求数据', details: result.error.format() },
        { status: 400 }
      );
    }
    
    // 登录用户
    const { user, token } = await loginUser(result.data);
    
    // 返回用户信息和令牌
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '登录失败' },
      { status: 400 }
    );
  }
} 