import { useState, useEffect, useCallback, useRef } from 'react';
import { postsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const useFeed = (pageSize = 5) => {
  const { user, isAuthenticated, toggleFollowUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const observerRef = useRef(null);

  const fetchFeed = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      setError('');

      const res = await postsAPI.getFeed(pageNum, pageSize);
      if (res.success && res.data) {
        if (append) {
          setPosts((prev) => {
            const existingIds = new Set(prev.map((p) => p._id));
            const newPosts = res.data.posts.filter((p) => !existingIds.has(p._id));
            return [...prev, ...newPosts];
          });
        } else {
          setPosts(res.data.posts);
        }
        setHasMore(Boolean(res.data.pagination?.hasMore));
        setPage(pageNum);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchFeed(1, false);
  }, [fetchFeed]);

  // Infinite scroll intersection observer
  useEffect(() => {
    if (loading || loadingMore || !hasMore) return;

    const currentSentinel = observerRef.current;
    if (!currentSentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchFeed(page + 1, true);
        }
      },
      { threshold: 0.1, rootMargin: '150px' }
    );

    observer.observe(currentSentinel);

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [hasMore, loadingMore, loading, page, fetchFeed]);

  const handlePostCreated = useCallback(async (postPayload) => {
    const res = await postsAPI.createPost(postPayload);
    if (res.success && res.data) {
      setPosts((prev) => [res.data.post, ...prev]);
    }
    return res;
  }, []);

  const handleToggleLike = useCallback(async (postId) => {
    if (!user) return;

    setPosts((prevPosts) => {
      return prevPosts.map((p) => {
        if (p._id !== postId) return p;

        const alreadyLiked = p.isLikedByMe;
        const updatedLikesCount = alreadyLiked
          ? Math.max(0, (p.likesCount || 0) - 1)
          : (p.likesCount || 0) + 1;
        let updatedLikes = p.likes ? [...p.likes] : [];

        if (alreadyLiked) {
          updatedLikes = updatedLikes.filter((l) => (l.userId || l._id) !== user._id);
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
      });
    });

    try {
      const res = await postsAPI.toggleLike(postId);
      if (res.success && res.data) {
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
      // Re-fetch or log error
      console.error('Like toggle failed:', err);
    }
  }, [user]);

  const handleAddComment = useCallback(async (postId, text, replyTo = '') => {
    if (!user) return;

    const optimisticComment = {
      _id: `temp-${Date.now()}`,
      userId: user._id,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      text,
      replyTo,
      createdAt: new Date().toISOString(),
    };

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
      const res = await postsAPI.addComment(postId, text, replyTo);
      if (res.success && res.data) {
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
      return res;
    } catch (err) {
      console.error('Comment addition failed:', err);
      throw err;
    }
  }, [user]);

  const handleDeletePost = useCallback(async (postId) => {
    await postsAPI.deletePost(postId);
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  }, []);

  const handleToggleFollow = useCallback(async (targetUserId) => {
    if (!isAuthenticated) return;

    const firstPost = posts.find((p) => p.author?.userId === targetUserId);
    const currentlyFollowing = firstPost ? !!firstPost.isFollowingAuthor : false;
    const nextFollowing = !currentlyFollowing;

    setPosts((prev) =>
      prev.map((p) =>
        p.author?.userId === targetUserId ? { ...p, isFollowingAuthor: nextFollowing } : p
      )
    );

    try {
      await toggleFollowUser(targetUserId);
    } catch (err) {
      setPosts((prev) =>
        prev.map((p) =>
          p.author?.userId === targetUserId
            ? { ...p, isFollowingAuthor: currentlyFollowing }
            : p
        )
      );
    }
  }, [isAuthenticated, posts, toggleFollowUser]);

  return {
    posts,
    loading,
    loadingMore,
    hasMore,
    error,
    observerRef,
    fetchFeed,
    handlePostCreated,
    handleToggleLike,
    handleAddComment,
    handleDeletePost,
    handleToggleFollow,
  };
};

export default useFeed;
