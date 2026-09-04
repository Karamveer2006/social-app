import React, { useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  Divider,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useAuth } from '../context/AuthContext';

dayjs.extend(relativeTime);

export const CommentSection = ({ postId, comments = [], onAddComment }) => {
  const { user, isAuthenticated } = useAuth();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;

    const commentText = text.trim();
    setText('');
    setSubmitting(true);
    try {
      await onAddComment(postId, commentText);
    } catch (err) {
      // Restore input text on failure
      setText(commentText);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid #F1F5F9' }}>
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
            fullWidth
            size="small"
            placeholder="Write a comment..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={submitting}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 5,
                bgcolor: '#F8FAFC',
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
        <Box sx={{ py: 1.5, px: 2, bgcolor: '#F8FAFC', borderRadius: 3, mb: 2, textAlign: 'center' }}>
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
                  src={comment.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.username}`}
                  alt={comment.name || comment.username}
                  sx={{ width: 32, height: 32 }}
                >
                  {comment.name?.[0] || comment.username?.[0] || 'U'}
                </Avatar>
              </ListItemAvatar>
              <Box
                sx={{
                  flexGrow: 1,
                  bgcolor: '#F8FAFC',
                  borderRadius: 3,
                  px: 1.75,
                  py: 1,
                  border: '1px solid #E2E8F0',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.25 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      {comment.name || comment.username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      @{comment.username}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.72rem' }}>
                    {comment.createdAt ? dayjs(comment.createdAt).fromNow() : 'just now'}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#1E293B', wordBreak: 'break-word' }}>
                  {comment.text}
                </Typography>
              </Box>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};
