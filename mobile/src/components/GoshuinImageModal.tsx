import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { ShrineTemple } from '../types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface GoshuinImageModalProps {
  visible: boolean;
  shrineTemple: ShrineTemple | null;
  onClose: () => void;
}

export const GoshuinImageModal: React.FC<GoshuinImageModalProps> = ({
  visible,
  shrineTemple,
  onClose,
}) => {
  const [imageError, setImageError] = useState(false);

  if (!shrineTemple) {
    return null;
  }

  const getTypeIcon = (type: string) => {
    return type === 'shrine' ? '⛩️' : '🏯';
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <Pressable style={styles.modalBackground} onPress={onClose}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {getTypeIcon(shrineTemple.type)} {shrineTemple.name} の御朱印
              </Text>
              <Pressable style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>

            {shrineTemple.photoUrl && !imageError ? (
              <Image
                source={{ uri: shrineTemple.photoUrl }}
                style={styles.fullScreenImage}
                resizeMode="contain"
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={styles.noImageContainer}>
                <Text style={styles.noImageText}>
                  {getTypeIcon(shrineTemple.type)}
                </Text>
                <Text style={styles.noImageText}>
                  御朱印画像がありません
                </Text>
              </View>
            )}

            <View style={styles.modalInfo}>
              <Text style={styles.modalInfoText}>{shrineTemple.address}</Text>
              {shrineTemple.hours_notes && (
                <Text style={styles.modalInfoText}>
                  ⏰ {shrineTemple.hours_notes}
                </Text>
              )}
              {shrineTemple.officialUrl && (
                <Text style={styles.modalInfoText}>
                  🔗 {shrineTemple.officialUrl}
                </Text>
              )}
            </View>
          </View>
        </Pressable>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    maxWidth: screenWidth * 0.9,
    maxHeight: screenHeight * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  fullScreenImage: {
    width: screenWidth * 0.8,
    height: screenWidth * 0.6,
    borderRadius: 8,
  },
  noImageContainer: {
    width: screenWidth * 0.8,
    height: screenWidth * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  noImageText: {
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
});