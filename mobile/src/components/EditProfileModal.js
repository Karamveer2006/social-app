import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';

export const EditProfileModal = ({
  visible,
  onClose,
  name,
  setName,
  bio,
  setBio,
  selectedAvatar,
  setSelectedAvatar,
  currentUser,
  colors,
  styles,
  saving,
  onPickAvatar,
  onSave,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Profile</Text>

          {/* Avatar Photo Picker Section */}
          <View style={styles.modalAvatarSection}>
            <TouchableOpacity
              style={styles.modalAvatarTouch}
              onPress={onPickAvatar}
              activeOpacity={0.8}
            >
              <Image
                source={{
                  uri:
                    selectedAvatar?.uri ||
                    currentUser?.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/png?seed=${currentUser?.username || 'user'}`,
                }}
                style={styles.modalAvatarPreview}
              />
              <View style={styles.cameraIconPill}>
                <Text style={styles.cameraIconText}>📷</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={onPickAvatar}>
              <Text style={styles.changePhotoBtnText}>
                {selectedAvatar ? 'Change Selected Photo' : 'Upload Profile Picture'}
              </Text>
            </TouchableOpacity>
            {selectedAvatar && (
              <TouchableOpacity onPress={() => setSelectedAvatar(null)}>
                <Text style={styles.removeSelectedPhotoText}>✕ Revert to original</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="Your full name"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.inputLabel}>Bio</Text>
          <TextInput
            style={[styles.textInput, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="Write something about yourself..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
          />

          <View style={styles.modalActionRow}>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalSaveBtn}
              onPress={onSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalSaveText}>Save Profile</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default EditProfileModal;
