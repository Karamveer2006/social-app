import React, { useRef } from 'react';
import {
  Container,
  Box,
  Typography,
  Avatar,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Divider,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { Navbar } from '../components/Navbar';
import { PostCard } from '../components/PostCard';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../context/AuthContext';

export const ProfilePage = () => {
  const { username: paramUsername } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const targetUsername = paramUsername || currentUser?.username;

  const {
    profile,
    posts,
    loading,
    error,
    isOwnProfile,
    followingLoading,
    openEditModal,
    setOpenEditModal,
    editName,
    setEditName,
    editBio,
    setEditBio,
    editAvatar,
    setEditAvatar,
    avatarFile,
    setAvatarFile,
    avatarPreview,
    setAvatarPreview,
    savingProfile,
    handleToggleFollow,
    handleOpenEditModal,
    handleSaveProfile,
    handleToggleLike,
    handleAddComment,
    handleDeletePost,
  } = useProfile(targetUsername);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
      <Navbar />

      <Container maxWidth="md" sx={{ mt: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mb: 2, color: 'text.secondary', fontWeight: 600 }}
        >
          Back to Feed
        </Button>

        {loading ? (
          <Box sx={{ py: 10, textAlign: 'center' }}>
            <CircularProgress size={40} color="primary" />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Loading user profile...
            </Typography>
          </Box>
        ) : error ? (
          <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="h6" color="error" sx={{ mb: 1 }}>
              {error}
            </Typography>
            <Button variant="outlined" onClick={() => navigate('/')}>
              Return Home
            </Button>
          </Card>
        ) : profile ? (
          <>
            <Card sx={{ mb: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
              <Box
                sx={{
                  height: 120,
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 50%, #7C3AED 100%)',
                }}
              />

              <CardContent sx={{ pt: 0, px: 3, pb: 3, position: 'relative' }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    mt: -6,
                    mb: 2,
                    flexWrap: 'wrap',
                    gap: 2,
                  }}
                >
                  <Avatar
                    src={profile.avatar}
                    alt={profile.name}
                    sx={{
                      width: 96,
                      height: 96,
                      border: '4px solid',
                      borderColor: 'background.paper',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                    }}
                  >
                    {profile.name?.[0]}
                  </Avatar>

                  <Box>
                    {isOwnProfile ? (
                      <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={handleOpenEditModal}
                        sx={{ borderRadius: 3, fontWeight: 700 }}
                      >
                        Edit Profile
                      </Button>
                    ) : (
                      <Button
                        variant={profile.isFollowing ? 'outlined' : 'contained'}
                        color="primary"
                        startIcon={profile.isFollowing ? <PersonRemoveIcon /> : <PersonAddIcon />}
                        onClick={handleToggleFollow}
                        disabled={followingLoading}
                        sx={{ borderRadius: 3, fontWeight: 700, px: 3 }}
                      >
                        {profile.isFollowing ? 'Following' : 'Follow'}
                      </Button>
                    )}
                  </Box>
                </Box>

                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {profile.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  @{profile.username}
                </Typography>

                {profile.bio ? (
                  <Typography variant="body1" sx={{ color: 'text.primary', mb: 2, maxWidth: 650 }}>
                    {profile.bio}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 2 }}>
                    No bio provided yet.
                  </Typography>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: 'text.secondary', mb: 2.5, fontSize: '0.85rem' }}>
                  <CalendarTodayIcon sx={{ fontSize: 16 }} />
                  <span>Joined {dayjs(profile.createdAt).format('MMMM YYYY')}</span>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', gap: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                      {posts.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {posts.length === 1 ? 'Post' : 'Posts'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
                      {profile.followersCount || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {profile.followersCount === 1 ? 'Follower' : 'Followers'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
                      {profile.followingCount || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Following
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
              Posts ({posts.length})
            </Typography>

            {posts.length === 0 ? (
              <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body1" color="text.secondary">
                  @{profile.username} hasn't shared any posts yet.
                </Typography>
              </Card>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onToggleLike={handleToggleLike}
                  onAddComment={handleAddComment}
                  onDeletePost={handleDeletePost}
                />
              ))
            )}
          </>
        ) : null}
      </Container>

      {/* Edit Profile Modal */}
      <Dialog
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Edit Profile</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, my: 1 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={avatarPreview || editAvatar || profile?.avatar}
                alt={editName}
                sx={{
                  width: 96,
                  height: 96,
                  fontSize: '2rem',
                  border: '3px solid',
                  borderColor: 'primary.main',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                }}
              >
                {editName?.[0]}
              </Avatar>
              <IconButton
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  position: 'absolute',
                  bottom: -4,
                  right: -4,
                  bgcolor: 'primary.main',
                  color: '#fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  '&:hover': { bgcolor: 'primary.dark' },
                  width: 36,
                  height: 36,
                }}
                size="small"
                title="Upload Profile Picture"
              >
                <PhotoCameraIcon fontSize="small" />
              </IconButton>
            </Box>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setAvatarFile(file);
                  setAvatarPreview(URL.createObjectURL(file));
                }
              }}
            />

            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<PhotoCameraIcon />}
                onClick={() => fileInputRef.current?.click()}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Choose Photo from Device
              </Button>
              {avatarFile && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 0.8 }}>
                  <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                    ✓ {avatarFile.name}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setAvatarFile(null);
                      setAvatarPreview('');
                    }}
                    title="Remove selected file"
                  >
                    <DeleteOutlinedIcon fontSize="small" color="error" />
                  </IconButton>
                </Box>
              )}
            </Box>
          </Box>

          <TextField
            label="Full Name"
            fullWidth
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />

          <TextField
            label="Bio (Tell everyone about yourself)"
            fullWidth
            multiline
            rows={3}
            value={editBio}
            onChange={(e) => setEditBio(e.target.value)}
          />

          <TextField
            label="Or Image Web Link (URL)"
            fullWidth
            size="small"
            value={editAvatar}
            onChange={(e) => {
              setEditAvatar(e.target.value);
              if (!avatarFile) setAvatarPreview(e.target.value);
            }}
            helperText="Upload a file above, or paste an external image link"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenEditModal(false)} disabled={savingProfile}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveProfile}
            disabled={savingProfile || !editName.trim()}
          >
            {savingProfile ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <MobileBottomNav />
    </Box>
  );
};
