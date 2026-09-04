import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Box,
  Container,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';
import LogoutIcon from '@mui/icons-material/Logout';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';

export const Navbar = ({ onOpenCreateModal }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { mode, toggleTheme, isDark } = useAppTheme();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleNavigateProfile = () => {
    handleCloseMenu();
    if (user?.username) {
      navigate(`/profile/${user.username}`);
    }
  };

  const handleLogout = () => {
    handleCloseMenu();
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="sticky" elevation={0} className="glass-nav">
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ minHeight: { xs: 58, sm: 68 } }}>
          {/* App Brand */}
          <Box
            component={Link}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'text.primary',
              flexGrow: 1,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                mr: 1.5,
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)',
              }}
            >
              <PublicIcon fontSize="small" />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '1.05rem', sm: '1.25rem' },
                  color: 'text.primary',
                  lineHeight: 1.1,
                }}
              >
                TaskPlanet
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'primary.main',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontSize: '0.7rem',
                }}
              >
                Social Community
              </Typography>
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.8, sm: 1.5 } }}>
            {/* Theme Toggle Button (Light/Dark mode) */}
            <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <IconButton
                onClick={toggleTheme}
                color="inherit"
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  color: isDark ? '#FACC15' : '#4B5563',
                }}
              >
                {isDark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
              </IconButton>
            </Tooltip>

            {isAuthenticated ? (
              <>
                {onOpenCreateModal && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddCircleIcon />}
                    onClick={onOpenCreateModal}
                    sx={{
                      display: { xs: 'none', sm: 'inline-flex' },
                      fontWeight: 600,
                    }}
                  >
                    Create Post
                  </Button>
                )}

                <Tooltip title="Account settings">
                  <IconButton onClick={handleOpenMenu} sx={{ p: 0.5 }}>
                    <Avatar
                      alt={user?.name || 'User'}
                      src={user?.avatar}
                      sx={{
                        width: 38,
                        height: 38,
                        border: '2px solid #2563EB',
                        bgcolor: 'primary.main',
                      }}
                    >
                      {user?.name?.[0] || 'U'}
                    </Avatar>
                  </IconButton>
                </Tooltip>

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleCloseMenu}
                  PaperProps={{
                    sx: {
                      mt: 1.5,
                      minWidth: 200,
                      borderRadius: 3,
                      boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                    },
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {user?.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      @{user?.username}
                    </Typography>
                  </Box>
                  <Divider />
                  <MenuItem onClick={handleNavigateProfile} sx={{ py: 1 }}>
                    <PersonOutlinedIcon fontSize="small" sx={{ mr: 1.5, color: 'primary.main' }} />
                    My Profile & Posts
                  </MenuItem>
                  <MenuItem onClick={handleLogout} sx={{ color: 'error.main', py: 1 }}>
                    <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
                    Log Out
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button
                  component={Link}
                  to="/login"
                  variant="outlined"
                  color="primary"
                  sx={{ borderRadius: 3 }}
                >
                  Log In
                </Button>
                <Button
                  component={Link}
                  to="/signup"
                  variant="contained"
                  color="primary"
                  sx={{ borderRadius: 3, display: { xs: 'none', sm: 'inline-flex' } }}
                >
                  Sign Up
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};
