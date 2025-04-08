import { NextRequest, NextResponse } from 'next/server';
import { revokeToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // 获取Authorization头
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }
    
    // 提取令牌
    const token = authHeader.split(' ')[1];
    
    // 撤销令牌
    await revokeToken(token);
    
    // 返回成功消息
    return NextResponse.json({ message: '登出成功' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '登出失败' },
      { status: 400 }
    );
  }
} 