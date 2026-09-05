import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
  StatusBar,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usersAPI, postsAPI } from '../api/client';
import { PostCard } from '../components/PostCard';
import { EditProfileModal } from '../components/EditProfileModal';
import { getProfileStyles } from '../styles/profileStyles';

export const ProfileScreen = ({ navigation, route }) => {
  const { user: currentUser, isAuthenticated, logout, updateUser, toggleFollowUser } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const styles = useMemo(() => getProfileStyles(colors, isDarkMode), [colors, isDarkMode]);

  const paramUsername = route?.params?.username;

  // Determine if viewing own profile or someone else's
  const isOtherUser =
    !!paramUsername && (!currentUser || currentUser.username !== paramUsername);

  // States for viewing another user's profile
  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [profileLoading, setProfileLoading] = useState(isOtherUser);
  const [followLoading, setFollowLoading] = useState(false);

  // States for editing own profile
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [saving, setSaving] = useState(false);

  // Fetch other user profile
  const fetchOtherUserProfile = useCallback(async () => {
    if (!paramUsername) return;
    setProfileLoading(true);
    try {
      const res = await usersAPI.getProfile(paramUsername);
      if (res.success && res.data) {
        setProfileUser(res.data.user);
        setUserPosts(res.data.posts || []);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  }, [paramUsername]);

  useEffect(() => {
    if (isOtherUser) {
      fetchOtherUserProfile();
    }
  }, [isOtherUser, fetchOtherUserProfile]);

  // Handle follow / unfollow on another user's profile
  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to follow users.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    if (!profileUser || followLoading) return;

    const previousIsFollowing = profileUser.isFollowing;
    const previousFollowers = profileUser.followersCount || 0;

    // Optimistic update
    setProfileUser((prev) => ({
      ...prev,
      isFollowing: !previousIsFollowing,
      followersCount: !previousIsFollowing
        ? previousFollowers + 1
        : Math.max(0, previousFollowers - 1),
    }));

    setFollowLoading(true);
    try {
      const res = await toggleFollowUser(profileUser._id);
      if (res.success && res.data) {
        setProfileUser((prev) => ({
          ...prev,
          isFollowing: res.data.isFollowing,
          followersCount: res.data.followersCount,
        }));
      }
    } catch (err) {
      // Revert optimistic update
      setProfileUser((prev) => ({
        ...prev,
        isFollowing: previousIsFollowing,
        followersCount: previousFollowers,
      }));
      Alert.alert('Error', err.response?.data?.message || 'Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  // Handle Post Actions for user posts
  const handleToggleLike = async (postId) => {
    if (!currentUser) return;
    try {
      const res = await postsAPI.toggleLike(postId);
      if (res.success && res.data) {
        setUserPosts((prev) =>
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
      console.warn('Like toggle failed:', err);
    }
  };

  const handleAddComment = async (postId, text, replyTo = '') => {
    if (!currentUser) return;
    try {
      const res = await postsAPI.addComment(postId, text, replyTo);
      if (res.success && res.data) {
        setUserPosts((prev) =>
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
      throw err;
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await postsAPI.deletePost(postId);
      setUserPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      console.warn('Delete failed:', err);
    }
  };

  // Own Profile Editing Handlers
  const handleOpenEdit = () => {
    setName(currentUser?.name || '');
    setBio(currentUser?.bio || '');
    setSelectedAvatar(null);
    setModalVisible(true);
  };

  const handlePickAvatar = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });
      if (result.assets && result.assets.length > 0) {
        setSelectedAvatar(result.assets[0]);
      }
    } catch (err) {
      console.warn('Avatar picker error:', err);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }
    setSaving(true);
    try {
      let res;
      if (selectedAvatar) {
        const formData = new FormData();
        formData.append('name', name.trim());
        formData.append('bio', bio.trim());
        formData.append('avatar', {
          uri: selectedAvatar.uri,
          type: selectedAvatar.type || 'image/jpeg',
          name: selectedAvatar.fileName || 'avatar.jpg',
        });
        res = await usersAPI.updateProfile(formData);
      } else {
        res = await usersAPI.updateProfile({
          name: name.trim(),
          bio: bio.trim(),
        });
      }

      if (res.success && res.data) {
        await updateUser(res.data.user);
        setSelectedAvatar(null);
        setModalVisible(false);
        Alert.alert('Success', 'Profile updated successfully!');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // If unauthenticated and looking at own profile
  if (!isOtherUser && !isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <View style={styles.guestContainer}>
          <Text style={styles.guestPlanetIcon}>🪐</Text>
          <Text style={styles.guestTitle}>Join TaskPlanet Social</Text>
          <Text style={styles.guestSubtitle}>
            Log in or sign up to interact with posts, customize your profile, and connect with other creators!
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.primaryBtnText}>Log In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.secondaryBtnText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // If viewing another user's profile
  if (isOtherUser) {
    if (profileLoading) {
      return (
        <SafeAreaView style={styles.centerContainer}>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </SafeAreaView>
      );
    }

    if (!profileUser) {
      return (
        <SafeAreaView style={styles.centerContainer}>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
          <Text style={styles.emptyText}>User not found</Text>
          <TouchableOpacity
            style={styles.backBtnPill}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        {/* Header with Back button */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backIconBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>@{profileUser.username}</Text>
          <View style={{ width: 36 }} />
        </View>

        <FlatList
          data={userPosts}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={
            <View style={styles.profileCard}>
              <Image
                source={{
                  uri:
                    profileUser.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/png?seed=${profileUser.username}`,
                }}
                style={styles.avatar}
              />
              <Text style={styles.name}>{profileUser.name}</Text>
              <Text style={styles.username}>@{profileUser.username}</Text>

              {profileUser.bio ? (
                <Text style={styles.bio}>{profileUser.bio}</Text>
              ) : (
                <Text style={styles.noBio}>No bio added yet.</Text>
              )}

              {/* Follow / Following Button */}
              <TouchableOpacity
                style={[
                  styles.followToggleBtn,
                  profileUser.isFollowing
                    ? styles.followingBtn
                    : styles.followBtn,
                ]}
                onPress={handleFollowToggle}
                disabled={followLoading}
              >
                <Text
                  style={[
                    styles.followToggleBtnText,
                    profileUser.isFollowing
                      ? styles.followingBtnText
                      : styles.followBtnText,
                  ]}
                >
                  {profileUser.isFollowing ? '✓ Following' : '+ Follow'}
                </Text>
              </TouchableOpacity>

              {/* Follower / Following Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>
                    {profileUser.followersCount || 0}
                  </Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>
                    {profileUser.followingCount || 0}
                  </Text>
                  <Text style={styles.statLabel}>Following</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{userPosts.length}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </View>
              </View>

              <View style={styles.postsSectionHeader}>
                <Text style={styles.postsSectionTitle}>Posts</Text>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <PostCard
              post={{
                ...item,
                isFollowingAuthor: profileUser?.isFollowing,
              }}
              onToggleLike={handleToggleLike}
              onAddComment={handleAddComment}
              onDeletePost={handleDeletePost}
              onToggleFollow={handleFollowToggle}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyPostsText}>No posts published yet.</Text>
          }
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      </SafeAreaView>
    );
  }

  // Own Profile View
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <View style={styles.profileWrapper}>
        <View style={styles.profileCard}>
          {/* Circular avatar with badge */}
          <View style={styles.avatarWrap}>
            <Image
              source={{
                uri:
                  currentUser?.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/png?seed=${currentUser?.username || 'user'}`,
              }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.avatarEditIconBadge} onPress={handleOpenEdit}>
              <Text style={{ fontSize: 13 }}>📷</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.name}>{currentUser?.name}</Text>
          <Text style={styles.username}>@{currentUser?.username}</Text>
          <Text style={styles.email}>{currentUser?.email}</Text>

          {currentUser?.bio ? (
            <Text style={styles.bio}>{currentUser?.bio}</Text>
          ) : (
            <Text style={styles.noBio}>No bio added yet.</Text>
          )}

          {/* Edit Bio / Profile Button */}
          <TouchableOpacity style={styles.editBtn} onPress={handleOpenEdit}>
            <Text style={styles.editBtnText}>✏️ Edit Profile & Photo</Text>
          </TouchableOpacity>

          {/* Follower / Following Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{currentUser?.followersCount || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{currentUser?.followingCount || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>Active</Text>
              <Text style={styles.statLabel}>Status</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Edit Profile Modal with Photo Picker */}
      <EditProfileModal
        visible={modalVisible}
        onClose={() => {
          setSelectedAvatar(null);
          setModalVisible(false);
        }}
        name={name}
        setName={setName}
        bio={bio}
        setBio={setBio}
        selectedAvatar={selectedAvatar}
        setSelectedAvatar={setSelectedAvatar}
        currentUser={currentUser}
        colors={colors}
        styles={styles}
        saving={saving}
        onPickAvatar={handlePickAvatar}
        onSave={handleSaveProfile}
      />
    </SafeAreaView>
  );
};

export default ProfileScreen;
