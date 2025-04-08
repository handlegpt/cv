import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const resumes = await prisma.resume.findMany({
      where: {
        user: {
          email: session.user.email
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        status: true,
        language: true,
        template: true,
        isPublic: true
      }
    });

    return NextResponse.json(resumes);
  } catch (error) {
    console.error('获取简历列表失败:', error);
    return NextResponse.json({ error: '获取简历列表失败' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const body = await request.json();
    const { title, content, language = 'zh', template = 'default' } = body;

    const resume = await prisma.resume.create({
      data: {
        title,
        content,
        language,
        template,
        userId: user.id,
        sections: [],
        settings: {
          font: 'default',
          colors: {
            primary: '#000000',
            secondary: '#666666'
          }
        }
      }
    });

    return NextResponse.json(resume);
  } catch (error) {
    console.error('创建简历失败:', error);
    return NextResponse.json({ error: '创建简历失败' }, { status: 500 });
  }
} 