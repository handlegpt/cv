import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const resume = await prisma.resume.findUnique({
      where: {
        id: params.id,
        user: {
          email: session.user.email
        }
      }
    });

    if (!resume) {
      return NextResponse.json({ error: '简历不存在' }, { status: 404 });
    }

    return NextResponse.json(resume);
  } catch (error) {
    console.error('获取简历详情失败:', error);
    return NextResponse.json({ error: '获取简历详情失败' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, sections, settings, status, isPublic } = body;

    const resume = await prisma.resume.update({
      where: {
        id: params.id,
        user: {
          email: session.user.email
        }
      },
      data: {
        title,
        content,
        sections,
        settings,
        status,
        isPublic,
        version: {
          increment: 1
        }
      }
    });

    return NextResponse.json(resume);
  } catch (error) {
    console.error('更新简历失败:', error);
    return NextResponse.json({ error: '更新简历失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    await prisma.resume.delete({
      where: {
        id: params.id,
        user: {
          email: session.user.email
        }
      }
    });

    return NextResponse.json({ message: '简历已删除' });
  } catch (error) {
    console.error('删除简历失败:', error);
    return NextResponse.json({ error: '删除简历失败' }, { status: 500 });
  }
} 