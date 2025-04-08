import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// 需要认证的路径
const protectedPaths = [
  '/dashboard',
  '/resumes',
  '/settings',
  '/api/resumes',
  '/api/settings',
];

// 检查路径是否需要认证
const isProtectedPath = (path: string): boolean => {
  return protectedPaths.some(protectedPath => 
    path.startsWith(protectedPath)
  );
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 检查是否是受保护的路径
  if (isProtectedPath(pathname)) {
    // 获取Authorization头
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // 如果是API请求，返回401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: '未授权' },
          { status: 401 }
        );
      }
      
      // 否则重定向到登录页面
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // 提取令牌
    const token = authHeader.split(' ')[1];
    
    // 验证令牌
    const userId = await verifyToken(token);
    
    if (!userId) {
      // 如果是API请求，返回401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: '未授权' },
          { status: 401 }
        );
      }
      
      // 否则重定向到登录页面
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了:
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (浏览器图标)
     * - public文件夹
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 