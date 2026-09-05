import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getPostCardStyles } from '../styles/postCardStyles';

dayjs.extend(relativeTime);

export const PostCard = ({
  post,
  onToggleLike,
  onAddComment,
  onDeletePost,
  onToggleFollow,
  onPressAuthor,
}) => {
  const { user, isAuthenticated } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const styles = useMemo(() => getPostCardStyles(colors, isDarkMode), [colors, isDarkMode]);

  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  const isLiked = post.isLikedByMe;
  const isAuthor =
    user &&
    ((post.author?.userId &&
      user._id?.toString() === post.author.userId?.toString()) ||
      (post.author?._id &&
        user._id?.toString() === post.author._id?.toString()) ||
      (user.username &&
        post.author?.username &&
        user.username.toLowerCase() === post.author.username.toLowerCase()));

  const targetAuthorId = post.author?.userId || post.author?._id || post.author?.username;

  const isFollowing =
    !!post.isFollowingAuthor ||
    (user?.following &&
      targetAuthorId &&
      user.following.some(
        (id) =>
          (id._id || id).toString() === post.author?.userId?.toString() ||
          (id._id || id).toString() === post.author?._id?.toString() ||
          (id.username || id).toString().toLowerCase() === post.author?.username?.toString().toLowerCase()
      ));

  const handleFollowPress = () => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please log in to follow creators.');
      return;
    }
    if (onToggleFollow && targetAuthorId) {
      onToggleFollow(post.author?.userId || post.author?._id || post.author?.username, post.author?.username);
    }
  };

  const handleLikePress = () => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please log in to like posts.');
      return;
    }
    onToggleLike(post._id);
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || submittingComment) return;
    const text = commentText.trim();
    const replyTargetId = replyingTo?.commentId;
    setCommentText('');
    setReplyingTo(null);
    setSubmittingComment(true);
    try {
      await onAddComment(post._id, text, replyTargetId);
    } catch (err) {
      setCommentText(text);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReplyPress = (comment) => {
    setReplyingTo({
      commentId: comment._id,
      username: comment.username || comment.name || 'user',
    });
  };

  return (
    <View style={styles.card}>
      {/* Author Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.authorTouchContainer}
          onPress={() => onPressAuthor && onPressAuthor(post.author?.username)}
          activeOpacity={0.7}
        >
          <Image
            source={{
              uri:
                post.author?.avatar ||
                `https://api.dicebear.com/7.x/avataaars/png?seed=${post.author?.username || 'taskplanet'}`,
            }}
            style={styles.avatar}
          />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{post.author?.name || 'TaskPlanet Creator'}</Text>
            <Text style={styles.authorUsername}>
              @{post.author?.username} • {dayjs(post.createdAt).fromNow()}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Follow / Following or Delete Button */}
        {isAuthor ? (
          <TouchableOpacity onPress={() => onDeletePost(post._id)} style={{ padding: 4 }}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.headerFollowBtn,
              isFollowing ? styles.headerFollowingBtn : styles.headerFollowBtnActive,
            ]}
            onPress={handleFollowPress}
          >
            <Text
              style={[
                styles.headerFollowBtnText,
                isFollowing ? styles.headerFollowingBtnText : styles.headerFollowBtnActiveText,
              ]}
            >
              {isFollowing ? '✓ Following' : '+ Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Post Text Content */}
      {post.content ? <Text style={styles.content}>{post.content}</Text> : null}

      {/* Post Image (if any) */}
      {post.imageUrl ? (
        <Image
          source={{ uri: post.imageUrl }}
          style={styles.postImage}
          resizeMode="cover"
        />
      ) : null}

      {/* Action Bar (Likes & Comments) */}
      <View style={styles.actionBar}>
        {/* Like Button */}
        <View style={styles.actionGroup}>
          <TouchableOpacity
            onPress={handleLikePress}
            style={[styles.actionBtn, isLiked && styles.likedBtn]}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionIcon, isLiked && styles.likedIcon]}>
              {isLiked ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowLikesModal(true)}>
            <Text style={[styles.actionCount, isLiked && styles.likedText]}>
              {post.likesCount || 0} {post.likesCount === 1 ? 'Like' : 'Likes'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Comments Count */}
        <View style={styles.actionGroup}>
          <TouchableOpacity
            onPress={() => setShowCommentsModal(true)}
            style={styles.actionBtn}
          >
            <Text style={styles.actionIcon}>💬</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowCommentsModal(true)}>
            <Text style={styles.actionCount}>
              {post.commentsCount || 0} {post.commentsCount === 1 ? 'Comment' : 'Comments'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Comments Modal / Bottom Sheet */}
      <Modal
        visible={showCommentsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCommentsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments ({post.commentsCount || 0})</Text>
              <TouchableOpacity onPress={() => setShowCommentsModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={post.comments || []}
              keyExtractor={(item, index) => item._id || index.toString()}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <Image
                    source={{
                      uri:
                        item.avatar ||
                        `https://api.dicebear.com/7.x/avataaars/png?seed=${item.username}`,
                    }}
                    style={styles.commentAvatar}
                  />
                  <View style={styles.commentBody}>
                    <View style={styles.commentMeta}>
                      <Text style={styles.commentUser}>{item.name || item.username}</Text>
                      <Text style={styles.commentTime}>
                        {item.createdAt ? dayjs(item.createdAt).fromNow() : 'now'}
                      </Text>
                    </View>
                    {item.replyToUsername && (
                      <Text style={styles.replyingToHeaderLabel}>
                        Replying to @{item.replyToUsername}
                      </Text>
                    )}
                    <Text style={styles.commentText}>{item.text}</Text>
                    {isAuthenticated && (
                      <TouchableOpacity
                        style={styles.replyActionBtn}
                        onPress={() => handleReplyPress(item)}
                      >
                        <Text style={styles.replyActionText}>Reply</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No comments yet. Be the first to comment!</Text>
              }
            />

            {/* Replying banner */}
            {replyingTo && (
              <View style={styles.replyingBanner}>
                <Text style={styles.replyingBannerText}>
                  Replying to <Text style={{ fontWeight: '700' }}>@{replyingTo.username}</Text>
                </Text>
                <TouchableOpacity onPress={() => setReplyingTo(null)}>
                  <Text style={styles.cancelReplyText}>✕ Cancel</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Input bar */}
            {isAuthenticated ? (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : 'Write a comment...'}
                  placeholderTextColor={colors.textSecondary}
                  value={commentText}
                  onChangeText={setCommentText}
                />
                <TouchableOpacity
                  onPress={handleSendComment}
                  disabled={!commentText.trim() || submittingComment}
                  style={[
                    styles.sendBtn,
                    !commentText.trim() && { opacity: 0.5 },
                  ]}
                >
                  <Text style={styles.sendText}>Send</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.loginHint}>Log in to write a comment</Text>
            )}
          </View>
        </View>
      </Modal>

      {/* Likes Modal */}
      <Modal
        visible={showLikesModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowLikesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentSmall}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Liked by ({post.likes?.length || post.likesCount || 0})</Text>
              <TouchableOpacity onPress={() => setShowLikesModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={post.likes || []}
              keyExtractor={(item, index) => item.userId || index.toString()}
              renderItem={({ item }) => (
                <View style={styles.likeItem}>
                  <Image
                    source={{
                      uri:
                        item.avatar ||
                        `https://api.dicebear.com/7.x/avataaars/png?seed=${item.username}`,
                    }}
                    style={styles.commentAvatar}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.commentUser}>{item.name || item.username}</Text>
                    <Text style={styles.authorUsername}>@{item.username}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No likes yet.</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PostCard;
