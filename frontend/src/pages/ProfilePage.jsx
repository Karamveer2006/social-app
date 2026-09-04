import React, { useState, useEffect, useCallback } from 'react';
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
  Alert,
  Divider,
  Grid,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useParams, useNavigate, Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { Navbar } from '../components/Navbar';
import { PostCard } from '../components/PostCard';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { usersAPI, postsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const ProfilePage = () => {
  const { username: paramUsername } = useParams();
  const { user: currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If no param, view own profile
  const targetUsername = paramUsername || currentUser?.username;

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [followingLoading, setFollowingLoading] = useState(false);

  // Edit profile dialog state
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const isOwnProfile =
    currentUser &&
    profile &&
    (currentUser._id === profile._id || currentUser.username === profile.username);

  const fetchProfile = useCallback(async () => {
    if (!targetUsername) return;
    setLoading(true);
    setError('');
    try {
      const res = await usersAPI.getProfile(targetUsername);
      if (res.success && res.data) {
        setProfile(res.data.user);
        setPosts(res.data.posts);
        setEditName(res.data.user.name || '');
        setEditBio(res.data.user.bio || '');
        setEditAvatar(res.data.user.avatar || '');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  }, [targetUsername]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Handle Follow / Unfollow toggle
  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!profile) return;

    setFollowingLoading(true);
    try {
      const res = await usersAPI.toggleFollow(profile._id);
      if (res.success && res.data) {
        setProfile((prev) => ({
          ...prev,
          isFollowing: res.data.isFollowing,
          followersCount: res.data.followersCount,
        }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update follow status');
    } finally {
      setFollowingLoading(false);
    }
  };

  // Handle Save Profile
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await usersAPI.updateProfile({
        name: editName,
        bio: editBio,
        avatar: editAvatar,
      });
      if (res.success && res.data) {
        setProfile((prev) => ({
          ...prev,
          name: res.data.user.name,
          bio: res.data.user.bio,
          avatar: res.data.user.avatar,
        }));
        setOpenEditModal(false);
        // Refresh posts with updated author details
        fetchProfile();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle post interactions on profile
  const handleToggleLike = async (postId) => {
    if (!currentUser) return;
    const previousPosts = [...posts];

    setPosts((prev) =>
      prev.map((p) => {
        if (p._id !== postId) return p;
        const alreadyLiked = p.isLikedByMe;
        const count = alreadyLiked ? Math.max(0, (p.likesCount || 0) - 1) : (p.likesCount || 0) + 1;
        let likes = p.likes ? [...p.likes] : [];

        if (alreadyLiked) {
          likes = likes.filter((l) => l.userId !== currentUser._id);
        } else {
          likes.push({
            userId: currentUser._id,
            username: currentUser.username,
            name: currentUser.name,
            avatar: currentUser.avatar,
            likedAt: new Date().toISOString(),
          });
        }

        return { ...p, isLikedByMe: !alreadyLiked, likesCount: count, likes };
      })
    );

    try {
      const res = await postsAPI.toggleLike(postId);
      if (res.success && res.data) {
        setPosts((prev) =>
          prev.map((p) =>
            p._id === postId
              ? {
                  ...p,
                  isLikedByMe: res.data.isLikedByMe,
                  likesCount: res.data.likesCount,
                  likes: res.data.likes,
                }
              : p
          )
        );
      }
    } catch (err) {
      setPosts(previousPosts);
    }
  };

  const handleAddComment = async (postId, text, replyTo = '') => {
    if (!currentUser) return;
    const optimisticComment = {
      _id: `temp-${Date.now()}`,
      userId: currentUser._id,
      username: currentUser.username,
      name: currentUser.name,
      avatar: currentUser.avatar,
      text,
      replyTo,
      createdAt: new Date().toISOString(),
    };

    setPosts((prev) =>
      prev.map((p) => {
        if (p._id !== postId) return p;
        return {
          ...p,
          comments: [...(p.comments || []), optimisticComment],
          commentsCount: (p.commentsCount || 0) + 1,
        };
      })
    );

    try {
      const res = await postsAPI.addComment(postId, text, replyTo);
      if (res.success && res.data) {
        setPosts((prev) =>
          prev.map((p) =>
            p._id === postId
              ? {
                  ...p,
                  comments: res.data.comments,
                  commentsCount: res.data.commentsCount,
                }
              : p
          )
        );
      }
    } catch (err) {
      fetchProfile();
      throw err;
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await postsAPI.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete post');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
      <Navbar />

      <Container maxWidth="md" sx={{ mt: 3 }}>
        {/* Back navigation */}
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
        ) : (
          <>
            {/* User Profile Banner & Details Card */}
            <Card sx={{ mb: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
              {/* Header Gradient Banner */}
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

                  {/* Actions (Edit Profile OR Follow/Unfollow) */}
                  <Box>
                    {isOwnProfile ? (
                      <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => setOpenEditModal(true)}
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

                {/* Name, Username & Bio */}
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

                {/* Joined date */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: 'text.secondary', mb: 2.5, fontSize: '0.85rem' }}>
                  <CalendarTodayIcon sx={{ fontSize: 16 }} />
                  <span>Joined {dayjs(profile.createdAt).format('MMMM YYYY')}</span>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Social Stats Counters */}
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

            {/* Posts published by this user */}
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
        )}
      </Container>

      {/* Edit Profile Modal */}
      <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Edit Profile</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
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
            label="Avatar Image Link (URL)"
            fullWidth
            value={editAvatar}
            onChange={(e) => setEditAvatar(e.target.value)}
            helperText="Provide an image web link or leave as Dicebear avatar"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
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

      {/* Mobile-only Bottom Navigation Bar */}
      <MobileBottomNav />
    </Box>
  );
};
