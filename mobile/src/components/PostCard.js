import React, { useState } from 'react';
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
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

dayjs.extend(relativeTime);

export const PostCard = ({ post, onToggleLike, onAddComment, onDeletePost }) => {
  const { user, isAuthenticated } = useAuth();
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const isLiked = post.isLikedByMe;
  const isAuthor = user && post.author?.userId && (user._id === post.author.userId);

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
    setCommentText('');
    setSubmittingComment(true);
    try {
      await onAddComment(post._id, text);
    } catch (err) {
      setCommentText(text);
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <View style={styles.card}>
      {/* Author Header */}
      <View style={styles.header}>
        <Image
          source={{
            uri:
              post.author?.avatar ||
              `https://api.dicebear.com/7.x/avataaars/png?seed=${post.author?.username || 'user'}`,
          }}
          style={styles.avatar}
        />
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{post.author?.name || post.author?.username}</Text>
          <Text style={styles.authorUsername}>
            @{post.author?.username} • {post.createdAt ? dayjs(post.createdAt).fromNow() : 'now'}
          </Text>
        </View>

        {isAuthor && (
          <TouchableOpacity
            onPress={() => {
              Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => onDeletePost(post._id) },
              ]);
            }}
          >
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content Text */}
      {!!post.content && <Text style={styles.content}>{post.content}</Text>}

      {/* Post Image */}
      {!!post.imageUrl && (
        <Image
          source={{ uri: post.imageUrl }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}

      {/* Actions (Like & Comment) */}
      <View style={styles.actionBar}>
        <View style={styles.actionGroup}>
          <TouchableOpacity onPress={handleLikePress} style={styles.actionBtn}>
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
                    <Text style={styles.commentText}>{item.text}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No comments yet. Be the first to comment!</Text>
              }
            />

            {/* Input bar */}
            {isAuthenticated ? (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Write a comment..."
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

      {/* Liked By Modal */}
      <Modal
        visible={showLikesModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowLikesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentSmall}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Liked By ({post.likesCount || 0})</Text>
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
                  <View>
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  authorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  authorName: {
    fontWeight: '700',
    fontSize: 15,
    color: colors.text,
  },
  authorUsername: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deleteText: {
    color: colors.heart,
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  postImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#F8FAFC',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 20,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    padding: 2,
  },
  actionIcon: {
    fontSize: 18,
  },
  likedIcon: {
    transform: [{ scale: 1.1 }],
  },
  actionCount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  likedText: {
    color: colors.heart,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    maxHeight: '75%',
    minHeight: '40%',
  },
  modalContentSmall: {
    backgroundColor: colors.card,
    borderRadius: 20,
    marginHorizontal: 24,
    marginVertical: 'auto',
    padding: 18,
    maxHeight: 380,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  closeBtn: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textSecondary,
    padding: 4,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  commentBody: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  commentUser: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  commentTime: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  commentText: {
    fontSize: 13,
    color: colors.text,
  },
  likeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 13,
    marginVertical: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    marginLeft: 10,
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  sendText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  loginHint: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 12,
    paddingTop: 10,
  },
});
