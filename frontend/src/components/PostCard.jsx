import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Avatar,
  IconButton,
  Typography,
  Box,
  Button,
  Menu,
  MenuItem,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlinedIcon from '@mui/icons-material/ChatBubbleOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CommentSection } from './CommentSection';
import { LikesModal } from './LikesModal';

dayjs.extend(relativeTime);

export const PostCard = ({ post, onToggleLike, onAddComment, onDeletePost, onToggleFollow }) => {
  const { user, isAuthenticated } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });

  const isLiked = post.isLikedByMe;
  const isAuthor =
    user &&
    ((post.author?.userId &&
      (user._id || '').toString() === (post.author.userId || '').toString()) ||
      (user.username &&
        post.author?.username &&
        user.username.toLowerCase() === post.author.username.toLowerCase()));

  const isFollowing =
    post.isFollowingAuthor ||
    (user?.following &&
      post.author?.userId &&
      user.following.some((id) => (id._id || id).toString() === post.author.userId.toString()));

  const handleFollowClick = () => {
    if (!isAuthenticated) {
      setToast({ open: true, message: 'Please log in to follow creators.', severity: 'warning' });
      return;
    }
    if (onToggleFollow && post.author?.userId) {
      onToggleFollow(post.author.userId, post.author.username);
    }
  };

  const handleLikeClick = () => {
    if (!isAuthenticated) {
      setToast({ open: true, message: 'Please log in to like posts.', severity: 'warning' });
      return;
    }
    onToggleLike(post._id);
  };

  const handleMenuOpen = (e) => setMenuAnchor(e.currentTarget);
  const handleMenuClose = () => setMenuAnchor(null);

  const handleDelete = () => {
    handleMenuClose();
    if (window.confirm('Are you sure you want to delete this post?')) {
      onDeletePost(post._id);
    }
  };

  return (
    <Card sx={{ mb: 2.5, border: '1px solid', borderColor: 'divider' }} className="animate-fade-in">
      {/* Post Author Header */}
      <CardHeader
        avatar={
          <Avatar
            component={Link}
            to={`/profile/${post.author?.username}`}
            src={post.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author?.username}`}
            alt={post.author?.name || post.author?.username}
            sx={{ width: 44, height: 44, border: '1.5px solid', borderColor: 'divider', textDecoration: 'none', cursor: 'pointer' }}
          >
            {post.author?.name?.[0] || post.author?.username?.[0] || 'U'}
          </Avatar>
        }
        action={
          isAuthor ? (
            <>
              <IconButton size="small" onClick={handleMenuOpen} sx={{ color: 'text.secondary' }}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
              <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
                <MenuItem onClick={handleDelete} sx={{ color: 'error.main', fontSize: '0.875rem' }}>
                  <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                  Delete Post
                </MenuItem>
              </Menu>
            </>
          ) : onToggleFollow && post.author?.userId ? (
            <Button
              size="small"
              variant={isFollowing ? 'outlined' : 'contained'}
              onClick={handleFollowClick}
              sx={{
                borderRadius: 20,
                fontSize: '0.75rem',
                textTransform: 'none',
                fontWeight: 700,
                px: 1.8,
                py: 0.3,
              }}
            >
              {isFollowing ? 'Following' : '+ Follow'}
            </Button>
          ) : null
        }
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              component={Link}
              to={`/profile/${post.author?.username}`}
              variant="subtitle2"
              sx={{ fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', color: 'text.primary', '&:hover': { color: 'primary.main' } }}
            >
              {post.author?.name || post.author?.username}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              @{post.author?.username}
            </Typography>
          </Box>
        }
        subheader={
          <Typography variant="caption" color="text.disabled">
            {post.createdAt ? dayjs(post.createdAt).fromNow() : 'just now'}
          </Typography>
        }
        sx={{ pb: 1 }}
      />

      {/* Post Body (Content Text) */}
      {post.content && (
        <CardContent sx={{ pt: 0, pb: 1 }}>
          <Typography
            variant="body1"
            sx={{
              color: 'text.primary',
              fontSize: '0.975rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {post.content}
          </Typography>
        </CardContent>
      )}

      {/* Post Media (Image) */}
      {post.imageUrl && (
        <Box className="post-media-container" sx={{ px: { xs: 0, sm: 2 } }}>
          <img
            src={post.imageUrl}
            alt="Post attachment"
            className="post-media-image"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </Box>
      )}

      {/* Action Bar (Likes, Comments Count & Triggers) */}
      <CardActions
        disableSpacing
        sx={{
          px: 2,
          py: 1,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Like Button */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title={isLiked ? 'Unlike' : 'Like'}>
              <IconButton
                onClick={handleLikeClick}
                size="small"
                sx={{
                  color: isLiked ? 'error.main' : 'text.secondary',
                  transition: 'transform 0.15s ease',
                  '&:active': { transform: 'scale(1.25)' },
                }}
              >
                {isLiked ? (
                  <FavoriteIcon className="heart-active" sx={{ fontSize: 22 }} />
                ) : (
                  <FavoriteBorderIcon sx={{ fontSize: 22 }} />
                )}
              </IconButton>
            </Tooltip>
            <Button
              size="small"
              onClick={() => setShowLikesModal(true)}
              sx={{
                p: 0.5,
                minWidth: 'auto',
                color: isLiked ? 'error.main' : 'text.secondary',
                fontWeight: 600,
                fontSize: '0.85rem',
                textTransform: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              {post.likesCount || 0} {post.likesCount === 1 ? 'Like' : 'Likes'}
            </Button>
          </Box>

          {/* Comment Toggle Button */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="View comments">
              <IconButton
                onClick={() => setShowComments(!showComments)}
                size="small"
                sx={{ color: showComments ? 'primary.main' : 'text.secondary' }}
              >
                <ChatBubbleOutlinedIcon sx={{ fontSize: 21 }} />
              </IconButton>
            </Tooltip>
            <Button
              size="small"
              onClick={() => setShowComments(!showComments)}
              sx={{
                p: 0.5,
                minWidth: 'auto',
                color: showComments ? 'primary.main' : 'text.secondary',
                fontWeight: 600,
                fontSize: '0.85rem',
                textTransform: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              {post.commentsCount || 0} {post.commentsCount === 1 ? 'Comment' : 'Comments'}
            </Button>
          </Box>
        </Box>
      </CardActions>

      {/* Expandable Comment Section */}
      {showComments && (
        <Box sx={{ px: 2, pb: 2 }}>
          <CommentSection
            postId={post._id}
            comments={post.comments || []}
            onAddComment={onAddComment}
          />
        </Box>
      )}

      {/* Modal displaying list of users who liked this post */}
      <LikesModal
        open={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        likes={post.likes || []}
      />

      {/* Non-intrusive feedback toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};
