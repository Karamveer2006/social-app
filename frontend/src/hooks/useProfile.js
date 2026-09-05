import { useState, useEffect, useCallback } from 'react';
import { usersAPI, postsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const useProfile = (targetUsername) => {
  const { user: currentUser, isAuthenticated, updateUser } = useAuth();

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
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
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

  const handleToggleFollow = useCallback(async () => {
    if (!isAuthenticated || !profile) return;

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
      console.error('Failed to update follow status:', err);
    } finally {
      setFollowingLoading(false);
    }
  }, [isAuthenticated, profile]);

  const handleOpenEditModal = useCallback(() => {
    setEditName(profile?.name || '');
    setEditBio(profile?.bio || '');
    setEditAvatar(profile?.avatar || '');
    setAvatarFile(null);
    setAvatarPreview('');
    setOpenEditModal(true);
  }, [profile]);

  const handleSaveProfile = useCallback(async () => {
    if (!editName.trim()) return;
    setSavingProfile(true);
    try {
      let res;
      if (avatarFile) {
        const formData = new FormData();
        formData.append('name', editName.trim());
        formData.append('bio', editBio.trim());
        formData.append('avatar', avatarFile);
        res = await usersAPI.updateProfile(formData);
      } else {
        res = await usersAPI.updateProfile({
          name: editName.trim(),
          bio: editBio.trim(),
          avatar: editAvatar.trim(),
        });
      }

      if (res.success && res.data) {
        setProfile((prev) => ({
          ...prev,
          name: res.data.user.name,
          bio: res.data.user.bio,
          avatar: res.data.user.avatar,
        }));
        if (updateUser) {
          updateUser(res.data.user);
        }
        setOpenEditModal(false);
        fetchProfile();
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      throw err;
    } finally {
      setSavingProfile(false);
    }
  }, [editName, editBio, editAvatar, avatarFile, updateUser, fetchProfile]);

  const handleToggleLike = useCallback(async (postId) => {
    if (!currentUser) return;

    setPosts((prev) =>
      prev.map((p) => {
        if (p._id !== postId) return p;
        const alreadyLiked = p.isLikedByMe;
        const count = alreadyLiked ? Math.max(0, (p.likesCount || 0) - 1) : (p.likesCount || 0) + 1;
        let likes = p.likes ? [...p.likes] : [];

        if (alreadyLiked) {
          likes = likes.filter((l) => (l.userId || l._id) !== currentUser._id);
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
      console.error('Like failed in profile:', err);
    }
  }, [currentUser]);

  const handleAddComment = useCallback(async (postId, text, replyTo = '') => {
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
      console.error('Comment failed in profile:', err);
      throw err;
    }
  }, [currentUser]);

  const handleDeletePost = useCallback(async (postId) => {
    await postsAPI.deletePost(postId);
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  }, []);

  return {
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
    fetchProfile,
    handleToggleFollow,
    handleOpenEditModal,
    handleSaveProfile,
    handleToggleLike,
    handleAddComment,
    handleDeletePost,
  };
};

export default useProfile;
