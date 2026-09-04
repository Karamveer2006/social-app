import React, { useState, useRef } from 'react';
import {
  Card,
  CardContent,
  Box,
  Avatar,
  TextField,
  Button,
  IconButton,
  Typography,
  Tooltip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import LinkIcon from '@mui/icons-material/Link';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import { useAuth } from '../context/AuthContext';

export const CreatePostCard = ({ onPostCreated }) => {
  const { user, isAuthenticated } = useAuth();
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  if (!isAuthenticated) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file must be smaller than 5MB');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setImageUrlInput('');
      setError('');
    }
  };

  const handleApplyUrl = () => {
    if (imageUrlInput.trim()) {
      setPreviewUrl(imageUrlInput.trim());
      setSelectedFile(null);
      setShowUrlDialog(false);
      setError('');
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setImageUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasContent = content.trim().length > 0;
    const hasImage = !!selectedFile || previewUrl.trim().length > 0;

    if (!hasContent && !hasImage) {
      setError('Please provide some text or attach an image to publish your post.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (selectedFile) {
        // Multipart Form Data upload
        const formData = new FormData();
        formData.append('content', content.trim());
        formData.append('image', selectedFile);
        await onPostCreated(formData);
      } else {
        // JSON post with text and/or image URL
        await onPostCreated({
          content: content.trim(),
          imageUrl: previewUrl.trim(),
        });
      }

      // Reset form
      setContent('');
      handleRemoveImage();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = (!content.trim() && !previewUrl) || loading;

  return (
    <Card sx={{ mb: 3, border: '1px solid #E2E8F0' }}>
      <CardContent sx={{ p: 2.5 }}>
        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <Avatar
            src={user?.avatar}
            alt={user?.name || 'User'}
            sx={{ width: 44, height: 44, border: '2px solid #2563EB' }}
          >
            {user?.name?.[0] || 'U'}
          </Avatar>

          <Box sx={{ flexGrow: 1 }}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              maxRows={6}
              placeholder="What's happening in your world? Share an update or image..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              variant="standard"
              InputProps={{
                disableUnderline: true,
                sx: { fontSize: '1rem', color: '#0F172A', p: 0.5 },
              }}
            />

            {/* Image Preview */}
            {previewUrl && (
              <Box
                sx={{
                  position: 'relative',
                  mt: 1.5,
                  mb: 1.5,
                  borderRadius: 3,
                  overflow: 'hidden',
                  border: '1px solid #E2E8F0',
                  maxHeight: 280,
                  bgcolor: '#F8FAFC',
                }}
              >
                <img
                  src={previewUrl}
                  alt="Upload preview"
                  style={{
                    width: '100%',
                    height: '240px',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                  onError={() => setError('Failed to preview the image URL. Please check the link.')}
                />
                <IconButton
                  size="small"
                  onClick={handleRemoveImage}
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    bgcolor: 'rgba(15, 23, 42, 0.75)',
                    color: '#fff',
                    '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.95)' },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            )}

            <Divider sx={{ my: 1.5 }} />

            {/* Bottom action bar */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <Tooltip title="Attach photo file">
                  <Button
                    size="small"
                    startIcon={<ImageIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{ color: 'text.secondary', px: 1.5 }}
                  >
                    Photo
                  </Button>
                </Tooltip>

                <Tooltip title="Paste image link">
                  <Button
                    size="small"
                    startIcon={<LinkIcon />}
                    onClick={() => setShowUrlDialog(true)}
                    sx={{ color: 'text.secondary', px: 1.5 }}
                  >
                    Image Link
                  </Button>
                </Tooltip>
              </Box>

              <Button
                variant="contained"
                color="primary"
                endIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                onClick={handleSubmit}
                disabled={isSubmitDisabled}
                sx={{ px: 3, fontWeight: 700 }}
              >
                {loading ? 'Posting...' : 'Post'}
              </Button>
            </Box>
          </Box>
        </Box>
      </CardContent>

      {/* Image URL Dialog */}
      <Dialog open={showUrlDialog} onClose={() => setShowUrlDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem' }}>Insert Image Link</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Image Web URL (HTTPS)"
            type="url"
            fullWidth
            variant="outlined"
            placeholder="https://images.unsplash.com/..."
            value={imageUrlInput}
            onChange={(e) => setImageUrlInput(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setShowUrlDialog(false)}>Cancel</Button>
          <Button onClick={handleApplyUrl} variant="contained">
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};
