'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Container, Grid, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface Resume {
  id: string;
  title: string;
  updatedAt: string;
  status: string;
  language: string;
  template: string;
  isPublic: boolean;
}

export default function ResumesPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await fetch('/api/resumes');
      if (!response.ok) throw new Error('获取简历列表失败');
      const data = await response.json();
      setResumes(data);
    } catch (error) {
      console.error('获取简历列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResume = () => {
    router.push('/resumes/new');
  };

  const handleEditResume = (id: string) => {
    router.push(`/resumes/${id}/edit`);
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1">
            我的简历
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateResume}
          >
            创建新简历
          </Button>
        </Grid>

        {resumes.length === 0 ? (
          <Grid item xs={12}>
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                您还没有创建任何简历
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleCreateResume}
                sx={{ mt: 2 }}
              >
                创建第一份简历
              </Button>
            </Card>
          </Grid>
        ) : (
          resumes.map((resume) => (
            <Grid item xs={12} sm={6} md={4} key={resume.id}>
              <Card
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 6,
                  },
                }}
                onClick={() => handleEditResume(resume.id)}
              >
                <Typography variant="h6" noWrap>
                  {resume.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  最后更新: {new Date(resume.updatedAt).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  状态: {resume.status === 'draft' ? '草稿' : '已发布'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  模板: {resume.template}
                </Typography>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Container>
  );
} 