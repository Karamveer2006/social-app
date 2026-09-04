import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Avatar,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  CircularProgress,
  Chip,
  Button,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ReplyIcon from '@mui/icons-material/Reply';
import CloseIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

dayjs.extend(relativeTime);

export const CommentSection = ({ postId, comments = [], onAddComment }) => {
  const { user, isAuthenticated } = useAuth();
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  const handleReplyClick = (targetUsername) => {
    setReplyingTo(targetUsername);
    setText(`@${targetUsername} `);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setText('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;

    const commentText = text.trim();
    const replyTarget = replyingTo;

    setText('');
    setReplyingTo(null);
    setSubmitting(true);

    try {
      await onAddComment(postId, commentText, replyTarget);
    } catch (err) {
      // Restore input text on failure
      setText(commentText);
      setReplyingTo(replyTarget);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
      {/* Replying banner */}
      {replyingTo && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, px: 1 }}>
          <Chip
            size="small"
            icon={<ReplyIcon sx={{ fontSize: '14px !important' }} />}
            label={`Replying to @${replyingTo}`}
            onDelete={handleCancelReply}
            color="primary"
            variant="outlined"
            sx={{ borderRadius: 2, fontSize: '0.75rem' }}
          />
        </Box>
      )}

      {/* Input box for new comment */}
      {isAuthenticated ? (
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mb: 2,
            px: 0.5,
          }}
        >
          <Avatar
            src={user?.avatar}
            alt={user?.name || 'User'}
            sx={{ width: 34, height: 34, bgcolor: 'primary.main' }}
          >
            {user?.name?.[0] || 'U'}
          </Avatar>
          <TextField
            inputRef={inputRef}
            fullWidth
            size="small"
            placeholder={replyingTo ? `Reply to @${replyingTo}...` : 'Write a comment or reply...'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={submitting}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 5,
                bgcolor: 'background.paper',
                fontSize: '0.875rem',
                pr: 0.5,
              },
            }}
            slotProps={{
              input: {
                endAdornment: (
                  <IconButton
                    type="submit"
                    color="primary"
                    size="small"
                    disabled={!text.trim() || submitting}
                    sx={{
                      bgcolor: text.trim() ? 'primary.main' : 'transparent',
                      color: text.trim() ? '#fff !important' : 'text.disabled',
                      '&:hover': {
                        bgcolor: text.trim() ? 'primary.dark' : 'transparent',
                      },
                      width: 30,
                      height: 30,
                    }}
                  >
                    {submitting ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <SendIcon sx={{ fontSize: 16 }} />
                    )}
                  </IconButton>
                ),
              },
            }}
          />
        </Box>
      ) : (
        <Box sx={{ py: 1.5, px: 2, bgcolor: 'background.paper', borderRadius: 3, mb: 2, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            Please log in to share your thoughts on this post.
          </Typography>
        </Box>
      )}

      {/* Existing comments list */}
      {comments.length === 0 ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', py: 1, textAlign: 'center' }}>
          No comments yet. Be the first to start the conversation!
        </Typography>
      ) : (
        <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {comments.map((comment, index) => (
            <ListItem
              key={comment._id || index}
              alignItems="flex-start"
              disableGutters
              sx={{ px: 0.5, py: 0.5 }}
            >
              <ListItemAvatar sx={{ minWidth: 42, mt: 0.5 }}>
                <Avatar
                  component={Link}
                  to={`/profile/${comment.username}`}
                  src={comment.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.username}`}
                  alt={comment.name || comment.username}
                  sx={{ width: 32, height: 32, textDecoration: 'none' }}
                >
                  {comment.name?.[0] || comment.username?.[0] || 'U'}
                </Avatar>
              </ListItemAvatar>
              <Box
                sx={{
                  flexGrow: 1,
                  bgcolor: 'background.paper',
                  borderRadius: 3,
                  px: 1.75,
                  py: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.25 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                    <Typography
                      component={Link}
                      to={`/profile/${comment.username}`}
                      variant="subtitle2"
                      sx={{ fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', color: 'text.primary', '&:hover': { color: 'primary.main' } }}
                    >
                      {comment.name || comment.username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      @{comment.username}
                    </Typography>
                    {comment.replyTo && (
                      <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, fontSize: '0.72rem' }}>
                        ↪ replied to @{comment.replyTo}
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.72rem' }}>
                    {comment.createdAt ? dayjs(comment.createdAt).fromNow() : 'just now'}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.primary', wordBreak: 'break-word', my: 0.5 }}>
                  {comment.text}
                </Typography>

                {/* Quick Reply Button */}
                {isAuthenticated && (
                  <Button
                    size="small"
                    startIcon={<ReplyIcon sx={{ fontSize: '13px !important' }} />}
                    onClick={() => handleReplyClick(comment.username)}
                    sx={{
                      p: 0,
                      minWidth: 'auto',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'primary.main',
                      textTransform: 'none',
                      mt: 0.25,
                    }}
                  >
                    Reply
                  </Button>
                )}
              </Box>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};
