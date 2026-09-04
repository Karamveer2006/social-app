import React, { useState } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const SignupPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    bio: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, username, email, password } = formData;

    if (!name.trim() || !username.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await signup(formData);
      if (res.success) {
        navigate('/');
      } else {
        setError(res.message || 'Signup failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#F1F5F9',
        py: 4,
        px: 2,
      }}
    >
      <Container maxWidth="xs">
        <Card sx={{ p: { xs: 2, sm: 3 }, borderRadius: 4, border: '1px solid #E2E8F0' }}>
          <CardContent sx={{ p: '8px !important' }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  mb: 1.5,
                  boxShadow: '0 8px 18px rgba(37, 99, 235, 0.35)',
                }}
              >
                <PublicIcon fontSize="medium" />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A' }}>
                Join TaskPlanet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create an account to start posting and engaging
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Full Name"
                name="name"
                variant="outlined"
                fullWidth
                size="small"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <TextField
                label="Username (letters, numbers, _)"
                name="username"
                variant="outlined"
                fullWidth
                size="small"
                value={formData.username}
                onChange={handleChange}
                required
              />

              <TextField
                label="Email Address"
                name="email"
                type="email"
                variant="outlined"
                fullWidth
                size="small"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <TextField
                label="Password (min 6 characters)"
                name="password"
                type="password"
                variant="outlined"
                fullWidth
                size="small"
                value={formData.password}
                onChange={handleChange}
                required
              />

              <TextField
                label="Short Bio (optional)"
                name="bio"
                variant="outlined"
                fullWidth
                size="small"
                value={formData.bio}
                onChange={handleChange}
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <PersonAddAltIcon />}
                sx={{ mt: 1, py: 1.2, fontWeight: 700 }}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </Box>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link to="/login" style={{ color: '#2563EB', fontWeight: 700 }}>
                  Log in here
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};
