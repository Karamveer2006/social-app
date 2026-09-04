import React, { useState } from 'react';
import {
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import PersonIcon from '@mui/icons-material/Person';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { CreatePostCard } from './CreatePostCard';

export const MobileBottomNav = ({ onPostCreated }) => {
  const { user, isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useAppTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [openPostModal, setOpenPostModal] = useState(false);

  // Determine current active tab
  const getActiveTab = () => {
    if (location.pathname === '/') return 0;
    if (location.pathname.startsWith('/profile')) return 2;
    return 0;
  };

  const handleTabChange = (event, newValue) => {
    if (newValue === 0) {
      if (location.pathname === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate('/');
      }
    } else if (newValue === 1) {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
      setOpenPostModal(true);
    } else if (newValue === 2) {
      if (isAuthenticated && user?.username) {
        navigate(`/profile/${user.username}`);
      } else {
        navigate('/login');
      }
    } else if (newValue === 3) {
      toggleTheme();
    }
  };

  const handleModalPostCreated = async (payload) => {
    if (onPostCreated) {
      await onPostCreated(payload);
    }
    setOpenPostModal(false);
  };

  return (
    <>
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          display: { xs: 'block', md: 'none' },
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
        }}
        elevation={4}
      >
        <BottomNavigation
          showLabels
          value={getActiveTab()}
          onChange={handleTabChange}
          sx={{
            height: 62,
            bgcolor: 'transparent',
            '& .MuiBottomNavigationAction-root': {
              minWidth: 0,
              py: 0.5,
              color: 'text.secondary',
              '&.Mui-selected': {
                color: 'primary.main',
                fontWeight: 700,
              },
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.72rem',
              '&.Mui-selected': {
                fontSize: '0.75rem',
                fontWeight: 700,
              },
            },
          }}
        >
          <BottomNavigationAction label="Feed" icon={<HomeIcon />} />
          <BottomNavigationAction
            label="Post"
            icon={
              <AddCircleIcon
                sx={{
                  fontSize: 30,
                  color: 'primary.main',
                  filter: 'drop-shadow(0 2px 4px rgba(37, 99, 235, 0.3))',
                }}
              />
            }
          />
          <BottomNavigationAction label="Profile" icon={<PersonIcon />} />
          <BottomNavigationAction
            label={isDark ? 'Light' : 'Dark'}
            icon={isDark ? <LightModeIcon sx={{ color: '#FACC15' }} /> : <DarkModeIcon />}
          />
        </BottomNavigation>
      </Paper>

      {/* Quick Post Dialog for Mobile Navigation */}
      <Dialog
        open={openPostModal}
        onClose={() => setOpenPostModal(false)}
        fullWidth
        maxWidth="sm"
        sx={{ zIndex: 1300 }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, fontWeight: 700 }}>
          Create New Post
          <IconButton size="small" onClick={() => setOpenPostModal(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1, px: { xs: 1.5, sm: 3 } }}>
          <Box sx={{ mt: 1 }}>
            <CreatePostCard
              onPostCreated={handleModalPostCreated}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};
