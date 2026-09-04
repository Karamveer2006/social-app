import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Avatar,
  Divider,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import { Navbar } from '../components/Navbar';
import { CreatePostCard } from '../components/CreatePostCard';
import { PostCard } from '../components/PostCard';
import { postsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const FeedPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  // Fetch feed with pagination
  const fetchFeed = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      setError('');

      const res = await postsAPI.getFeed(pageNum, 5);
      if (res.success && res.data) {
        if (append) {
          setPosts((prev) => [...prev, ...res.data.posts]);
        } else {
          setPosts(res.data.posts);
        }
        setHasMore(res.data.pagination.hasMore);
        setPage(pageNum);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed(1, false);
  }, [fetchFeed]);

  // Handle post created
  const handlePostCreated = async (postPayload) => {
    const res = await postsAPI.createPost(postPayload);
    if (res.success && res.data) {
      // Prepend the new post immediately
      setPosts((prev) => [res.data.post, ...prev]);
    }
  };

  // Optimistic Like Update (Requirement: Like updates reflect instantly in UI!)
  const handleToggleLike = async (postId) => {
    if (!user) return;

    // Snapshot current state for rollback
    const previousPosts = [...posts];

    // Optimistically update
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p._id !== postId) return p;

        const alreadyLiked = p.isLikedByMe;
        const updatedLikesCount = alreadyLiked ? Math.max(0, (p.likesCount || 0) - 1) : (p.likesCount || 0) + 1;
        let updatedLikes = p.likes ? [...p.likes] : [];

        if (alreadyLiked) {
          updatedLikes = updatedLikes.filter((l) => l.userId !== user._id);
        } else {
          updatedLikes.push({
            userId: user._id,
            username: user.username,
            name: user.name,
            avatar: user.avatar,
            likedAt: new Date().toISOString(),
          });
        }

        return {
          ...p,
          isLikedByMe: !alreadyLiked,
          likesCount: updatedLikesCount,
          likes: updatedLikes,
        };
      })
    );

    try {
      const res = await postsAPI.toggleLike(postId);
      if (res.success && res.data) {
        // Sync with exact server response
        setPosts((prevPosts) =>
          prevPosts.map((p) =>
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
      console.error('Like failed, reverting optimistic update:', err);
      // Revert on error
      setPosts(previousPosts);
    }
  };

  // Optimistic Comment Update (Requirement: Comment updates reflect instantly in UI!)
  const handleAddComment = async (postId, text) => {
    if (!user) return;

    // Temporary optimistic comment object
    const optimisticComment = {
      _id: `temp-${Date.now()}`,
      userId: user._id,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      text,
      createdAt: new Date().toISOString(),
    };

    const previousPosts = [...posts];

    // Optimistically append comment
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p._id !== postId) return p;
        const currentComments = p.comments || [];
        return {
          ...p,
          comments: [...currentComments, optimisticComment],
          commentsCount: (p.commentsCount || 0) + 1,
        };
      })
    );

    try {
      const res = await postsAPI.addComment(postId, text);
      if (res.success && res.data) {
        // Replace temp comment with server result
        setPosts((prevPosts) =>
          prevPosts.map((p) =>
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
      console.error('Comment failed, reverting optimistic update:', err);
      setPosts(previousPosts);
      throw err;
    }
  };

  // Delete post
  const handleDeletePost = async (postId) => {
    try {
      await postsAPI.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete post');
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchFeed(page + 1, true);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F1F5F9', pb: 8 }}>
      <Navbar />

      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <Grid container spacing={3}>
          {/* Left Column (Main Feed & Post Composer) */}
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Create Post Widget */}
            <CreatePostCard onPostCreated={handlePostCreated} />

            {/* Error notification if any */}
            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {/* Loading Skeleton / Spinner */}
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
                  />
                ))}

                {/* Pagination: Load More */}
                {hasMore && (
                  <Box sx={{ textAlign: 'center', mt: 3, mb: 2 }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      startIcon={loadingMore ? <CircularProgress size={16} /> : <RefreshIcon />}
                      sx={{ borderRadius: 3, px: 3, py: 1 }}
                    >
                      {loadingMore ? 'Loading more posts...' : 'Load More Posts'}
                    </Button>
                  </Box>
                )}
              </>
            )}
          </Grid>

          {/* Right Column (Community info & Active User Card) */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ position: { md: 'sticky' }, top: 88 }}>
              {/* User profile card */}
              {isAuthenticated && user && (
                <Card sx={{ mb: 2.5, p: 2 }}>
                  <CardContent sx={{ p: '8px !important', textAlign: 'center' }}>
                    <Avatar
                      src={user.avatar}
                      alt={user.name}
                      sx={{
                        width: 68,
                        height: 68,
                        mx: 'auto',
                        mb: 1.5,
                        border: '3px solid #2563EB',
                      }}
                    >
                      {user.name?.[0]}
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
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
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                          {posts.reduce((acc, p) => acc + (p.likes?.filter((l) => l.userId === user._id).length || 0), 0)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Likes Given
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* TaskPlanet Inspiration card */}
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
    </Box>
  );
};
