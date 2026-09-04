import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { postsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

export const CreatePostScreen = ({ navigation }) => {
  const { isAuthenticated } = useAuth();
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handlePickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0]);
        setImageUrl('');
      }
    } catch (err) {
      console.warn('Image picker error:', err);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImageUrl('');
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please log in to share posts.', [
        { text: 'Cancel' },
        { text: 'Log In', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }

    const hasText = content.trim().length > 0;
    const hasImage = !!selectedImage || imageUrl.trim().length > 0;

    if (!hasText && !hasImage) {
      Alert.alert('Empty Post', 'Please write something or attach an image to post.');
      return;
    }

    setSubmitting(true);
    try {
      if (selectedImage) {
        const formData = new FormData();
        formData.append('content', content.trim());
        formData.append('image', {
          uri: selectedImage.uri,
          type: selectedImage.type || 'image/jpeg',
          name: selectedImage.fileName || 'upload.jpg',
        });
        await postsAPI.createPost(formData);
      } else {
        await postsAPI.createPost({
          content: content.trim(),
          imageUrl: imageUrl.trim(),
        });
      }

      // Clear & return to feed
      setContent('');
      handleRemoveImage();
      Alert.alert('Success', 'Your post is now live!', [
        { text: 'OK', onPress: () => navigation.navigate('Social') },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Create New Post</Text>
        <Text style={styles.subtitle}>
          Share thoughts, achievements, or photos with the community.
        </Text>

        {/* Text Input */}
        <TextInput
          style={styles.textArea}
          placeholder="What's happening? Share text, image, or both..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={6}
          value={content}
          onChangeText={setContent}
          textAlignVertical="top"
        />

        {/* Image Preview */}
        {(selectedImage || imageUrl) && (
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: selectedImage ? selectedImage.uri : imageUrl }}
              style={styles.previewImage}
              resizeMode="cover"
            />
            <TouchableOpacity style={styles.removeBtn} onPress={handleRemoveImage}>
              <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Image action buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handlePickImage}>
            <Text style={styles.secondaryBtnText}>📷 Select Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Optional Direct URL input */}
        <TextInput
          style={styles.urlInput}
          placeholder="Or paste an image web link (https://...)"
          placeholderTextColor={colors.textSecondary}
          value={imageUrl}
          onChangeText={(val) => {
            setImageUrl(val);
            if (val.trim()) setSelectedImage(null);
          }}
          autoCapitalize="none"
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Publish Post</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 18,
  },
  textArea: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: colors.text,
    minHeight: 140,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  previewContainer: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F8FAFC',
  },
  removeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  secondaryBtn: {
    backgroundColor: '#E0E7FF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  secondaryBtnText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  urlInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
