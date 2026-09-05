import React from 'react';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Avatar,
  Divider,
  Button,
} from '@mui/material';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { CreatePostCard } from '../components/CreatePostCard';
import { PostCard } from '../components/PostCard';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { useAuth } from '../context/AuthContext';
import { useFeed } from '../hooks/useFeed';

export const FeedPage = () => {
  const { user, isAuthenticated } = useAuth();
  const {
    posts,
    loading,
    loadingMore,
    hasMore,
    error,
    observerRef,
    handlePostCreated,
    handleToggleLike,
    handleAddComment,
    handleDeletePost,
    handleToggleFollow,
  } = useFeed(5);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: { xs: 11, md: 8 } }}>
      <Navbar />

      <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 3 } }}>
        <Grid container spacing={3}>
          {/* Left Column (Main Feed & Post Composer) */}
          <Grid size={{ xs: 12, md: 8 }}>
            <CreatePostCard onPostCreated={handlePostCreated} />

            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {loading ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <CircularProgress size={40} color="primary" />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Loading community feed...
                </Typography>
              </Box>
            ) : posts.length === 0 ? (
              <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1 }}>
                  No posts yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Be the first one to create a post in this community!
                </Typography>
              </Card>
            ) : (
              <>
                {posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onToggleLike={handleToggleLike}
                    onAddComment={handleAddComment}
                    onDeletePost={handleDeletePost}
                    onToggleFollow={handleToggleFollow}
                  />
                ))}

                {/* Infinite Scroll Sentinel */}
                <Box
                  ref={observerRef}
                  sx={{
                    py: 3,
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {loadingMore && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'text.secondary' }}>
                      <CircularProgress size={22} color="primary" />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Loading more posts...
                      </Typography>
                    </Box>
                  )}
                  {!hasMore && posts.length > 0 && !loading && (
                    <Typography variant="caption" color="text.secondary" sx={{ py: 1, letterSpacing: '0.02em' }}>
                      ✓ You have caught up with all posts
                    </Typography>
                  )}
                </Box>
              </>
            )}
          </Grid>

          {/* Right Column (Community info & Active User Card) */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ position: { md: 'sticky' }, top: 88 }}>
              {isAuthenticated && user && (
                <Card sx={{ mb: 2.5, p: 2 }}>
                  <CardContent sx={{ p: '8px !important', textAlign: 'center' }}>
                    <Avatar
                      component={Link}
                      to={`/profile/${user.username}`}
                      src={user.avatar}
                      alt={user.name}
                      sx={{
                        width: 68,
                        height: 68,
                        mx: 'auto',
                        mb: 1.5,
                        border: '3px solid',
                        borderColor: 'primary.main',
                        textDecoration: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {user.name?.[0]}
                    </Avatar>
                    <Typography
                      component={Link}
                      to={`/profile/${user.username}`}
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        textDecoration: 'none',
                        color: 'text.primary',
                        display: 'block',
                        '&:hover': { color: 'primary.main' },
                      }}
                    >
                      {user.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      @{user.username}
                    </Typography>
                    {user.bio && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                        {user.bio}
                      </Typography>
                    )}

                    <Button
                      component={Link}
                      to={`/profile/${user.username}`}
                      variant="outlined"
                      size="small"
                      startIcon={<PersonOutlinedIcon />}
                      sx={{ mb: 2, borderRadius: 3, fontWeight: 600, fontSize: '0.8rem' }}
                    >
                      View Full Profile
                    </Button>

                    <Divider sx={{ my: 1.5 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                          {posts.filter((p) => p.author?.userId === user._id).length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          My Posts
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                          {user.followersCount || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Followers
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                          {user.followingCount || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Following
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Inspiration card */}
              <Card sx={{ p: 2, background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)', color: '#fff' }}>
                <CardContent sx={{ p: '8px !important' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TaskAltIcon sx={{ color: '#93C5FD' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      TaskPlanet Social Feed
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#E0E7FF', mb: 2, fontSize: '0.85rem' }}>
                    Share updates, post photos, explore public posts, like with animated reactions, and engage in real-time discussion threads.
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#BFDBFE', fontSize: '0.8rem' }}>
                    <GroupOutlinedIcon sx={{ fontSize: 18 }} />
                    <span>Public community open to all users</span>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Mobile-only Bottom Tab Navigation Bar */}
      <MobileBottomNav onPostCreated={handlePostCreated} />
    </Box>
  );
};
