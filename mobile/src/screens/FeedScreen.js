import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { PostCard } from '../components/PostCard';
import { postsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const FeedScreen = ({ navigation }) => {
  const { user, isAuthenticated, toggleFollowUser } = useAuth();
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDarkMode), [colors, isDarkMode]);

  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchFeed = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1 && !append) setLoading(true);
      const res = await postsAPI.getFeed(pageNum, 10);
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
      console.warn('Feed fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed(1, false);
  }, [fetchFeed]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFeed(1, false);
  };

  const onEndReached = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      fetchFeed(page + 1, true);
    }
  };

  // Optimistic Like Handler
  const handleToggleLike = async (postId) => {
    if (!user) return;
    const previousPosts = [...posts];

    setPosts((prev) =>
      prev.map((p) => {
        if (p._id !== postId) return p;
        const alreadyLiked = p.isLikedByMe;
        const count = alreadyLiked ? Math.max(0, (p.likesCount || 0) - 1) : (p.likesCount || 0) + 1;
        let likes = p.likes ? [...p.likes] : [];

        if (alreadyLiked) {
          likes = likes.filter((l) => l.userId !== user._id);
        } else {
          likes.push({
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
          likesCount: count,
          likes,
        };
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

  // Optimistic Comment & Reply Handler
  const handleAddComment = async (postId, text, replyTo = '') => {
    if (!user) return;
    const tempComment = {
      _id: `temp-${Date.now()}`,
      userId: user._id,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      text,
      replyTo: replyTo || null,
      createdAt: new Date().toISOString(),
    };

    const previousPosts = [...posts];

    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId
          ? {
              ...p,
              comments: [...(p.comments || []), tempComment],
              commentsCount: (p.commentsCount || 0) + 1,
            }
          : p
      )
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
      setPosts(previousPosts);
      throw err;
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await postsAPI.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      console.warn('Delete failed:', err);
    }
  };

  // Follow / Unfollow Author Handler
  const handleToggleFollow = async (targetUserId, targetUsername) => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }

    const isPostFromAuthor = (p) =>
      (targetUserId &&
        (p.author?.userId?.toString() === targetUserId?.toString() ||
          p.author?._id?.toString() === targetUserId?.toString())) ||
      (targetUsername &&
        p.author?.username?.toLowerCase() === targetUsername?.toLowerCase());

    const firstPost = posts.find(isPostFromAuthor);
    const currentlyFollowing = firstPost ? !!firstPost.isFollowingAuthor : false;
    const nextFollowing = !currentlyFollowing;

    // Optimistically update all posts from this author in the feed
    setPosts((prev) =>
      prev.map((p) =>
        isPostFromAuthor(p) ? { ...p, isFollowingAuthor: nextFollowing } : p
      )
    );

    try {
      const res = await toggleFollowUser(targetUserId || targetUsername);
      if (res.success && res.data) {
        setPosts((prev) =>
          prev.map((p) =>
            isPostFromAuthor(p)
              ? { ...p, isFollowingAuthor: res.data.isFollowing }
              : p
          )
        );
      }
    } catch (err) {
      // Revert optimistic update
      setPosts((prev) =>
        prev.map((p) =>
          isPostFromAuthor(p)
            ? { ...p, isFollowingAuthor: currentlyFollowing }
            : p
        )
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Header matching web navbar */}
      <View style={styles.navBar}>
        <View style={styles.brandGroup}>
          <Text style={styles.planetIcon}>🪐</Text>
          <View>
            <Text style={styles.brandTitle}>TaskPlanet</Text>
            <Text style={styles.brandSubtitle}>SOCIAL COMMUNITY</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          {/* Dark / Light Mode Toggle Button */}
          <TouchableOpacity
            style={styles.themeToggleBtn}
            onPress={toggleTheme}
            activeOpacity={0.7}
            accessibilityLabel="Toggle dark mode"
          >
            <Text style={styles.themeToggleIcon}>{isDarkMode ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>

          {isAuthenticated ? (
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => navigation.navigate('Create')}
            >
              <Text style={styles.createBtnText}>+ Post</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.loginHeaderBtn}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginHeaderText}>Log In</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Feed list */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading feed...</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onToggleLike={handleToggleLike}
              onAddComment={handleAddComment}
              onDeletePost={handleDeletePost}
              onToggleFollow={handleToggleFollow}
              onPressAuthor={(username) => navigation.navigate('UserProfile', { username })}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          onEndReached={onEndReached}
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Text style={styles.emptyPlanet}>🪐</Text>
                </View>
                <Text style={styles.emptyTitle}>No posts yet</Text>
                <Text style={styles.emptySubtitle}>
                  Be the first one to share an update or photo with the community!
                </Text>
                {isAuthenticated ? (
                  <TouchableOpacity
                    style={styles.emptyActionBtn}
                    onPress={() => navigation.navigate('Create')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.emptyActionBtnText}>+ Create First Post</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.emptyActionBtn}
                    onPress={() => navigation.navigate('Login')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.emptyActionBtnText}>Log In to Post</Text>
                  </TouchableOpacity>
                )}
              </View>
            )
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ marginVertical: 14 }}
              />
            ) : null
          }
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 24, flexGrow: 1 }}
        />
      )}
    </SafeAreaView>
  );
};

const getStyles = (colors, isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    navBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
    },
    brandGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    planetIcon: {
      fontSize: 24,
    },
    brandTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.3,
    },
    brandSubtitle: {
      fontSize: 9,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 1,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    themeToggleBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    themeToggleIcon: {
      fontSize: 16,
    },
    createBtn: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    createBtnText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 13,
    },
    loginHeaderBtn: {
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 7,
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : '#EFF6FF',
    },
    loginHeaderText: {
      color: colors.primary,
      fontWeight: '700',
      fontSize: 13,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      color: colors.textSecondary,
      fontSize: 14,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      paddingHorizontal: 24,
      marginHorizontal: 16,
      marginTop: 24,
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    emptyIconCircle: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: isDark ? '#1E293B' : '#EFF6FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    emptyPlanet: {
      fontSize: 26,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 6,
    },
    emptySubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 19,
      marginBottom: 18,
      maxWidth: 260,
    },
    emptyActionBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 11,
      borderRadius: 12,
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 2,
    },
    emptyActionBtnText: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: 14,
    },
  });
