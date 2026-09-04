import React, { useState, useEffect, useCallback } from 'react';
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
import { colors } from '../theme/colors';

export const FeedScreen = ({ navigation }) => {
  const { user, isAuthenticated } = useAuth();
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

  // Optimistic Comment Handler
  const handleAddComment = async (postId, text) => {
    if (!user) return;
    const tempComment = {
      _id: `temp-${Date.now()}`,
      userId: user._id,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      text,
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
      const res = await postsAPI.addComment(postId, text);
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.navBar}>
        <View>
          <Text style={styles.brandTitle}>TaskPlanet</Text>
          <Text style={styles.brandSubtitle}>SOCIAL COMMUNITY</Text>
        </View>

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
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ marginVertical: 14 }}
              />
            ) : null
          }
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1.2,
  },
  createBtn: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  loginHeaderBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
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
    marginTop: 10,
    color: colors.textSecondary,
    fontSize: 14,
  },
});
