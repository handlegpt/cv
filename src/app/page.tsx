import { Button, Container, Typography, Box } from '@mui/material';
import Link from 'next/link';

export default function Home() {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          py: 8,
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          智能简历系统
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          使用 AI 技术，轻松创建专业简历
        </Typography>
        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button
            component={Link}
            href="/auth/register"
            variant="contained"
            size="large"
          >
            立即注册
          </Button>
          <Button
            component={Link}
            href="/auth/login"
            variant="outlined"
            size="large"
          >
            登录
          </Button>
        </Box>
      </Box>
    </Container>
  );
} 