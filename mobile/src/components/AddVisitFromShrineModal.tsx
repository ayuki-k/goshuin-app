import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { ShrineTemple, VisitRecord } from '../types';

interface AddVisitFromShrineModalProps {
  visible: boolean;
  shrineTemple: ShrineTemple | null;
  onClose: () => void;
  onSave: (visitData: Omit<VisitRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const AddVisitFromShrineModal: React.FC<AddVisitFromShrineModalProps> = ({
  visible,
  shrineTemple,
  onClose,
  onSave,
}) => {
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [hasGoshuin, setHasGoshuin] = useState(false);
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [isFavorite, setIsFavorite] = useState(false);

  const resetForm = () => {
    setVisitDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setHasGoshuin(false);
    setRating(undefined);
    setIsFavorite(false);
  };

  // 神社・寺院情報が変わった時に御朱印の初期値を設定
  useEffect(() => {
    if (shrineTemple) {
      setHasGoshuin(shrineTemple.hasGoshuin || false);
    }
  }, [shrineTemple]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = () => {
    if (!shrineTemple) {
      Alert.alert('エラー', '神社・寺院情報が選択されていません');
      return;
    }

    const visitData: Omit<VisitRecord, 'id' | 'createdAt' | 'updatedAt'> = {
      shrineTempleId: shrineTemple.id,
      shrineTempleName: shrineTemple.name,
      visitDate,
      notes: notes.trim() || undefined,
      hasGoshuin,
      rating,
      isFavorite,
    };

    onSave(visitData);
    resetForm();
  };

  const RatingSelector = () => (
    <View style={styles.ratingContainer}>
      <Text style={styles.sectionLabel}>評価</Text>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(rating === star ? undefined : star)}
            style={styles.starButton}
          >
            <Text style={[
              styles.star,
              rating && rating >= star ? styles.activeStar : null
            ]}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
        {rating && (
          <TouchableOpacity
            onPress={() => setRating(undefined)}
            style={styles.clearRatingButton}
          >
            <Text style={styles.clearRatingText}>クリア</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.cancelButton}>キャンセル</Text>
          </TouchableOpacity>
          <Text style={styles.title}>参拝記録を追加</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>保存</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 神社・寺院情報表示 */}
          {shrineTemple && (
            <View style={styles.shrineInfoContainer}>
              <Text style={styles.shrineInfoTitle}>
                {shrineTemple.type === 'shrine' ? '⛩️' : '🏯'} {shrineTemple.name}
              </Text>
              <Text style={styles.shrineInfoSubtitle}>
                {shrineTemple.prefecture} {shrineTemple.city}
              </Text>
              {shrineTemple.address && (
                <Text style={styles.shrineInfoAddress}>{shrineTemple.address}</Text>
              )}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>参拝日</Text>
            <TextInput
              style={styles.textInput}
              value={visitDate}
              onChangeText={setVisitDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>御朱印</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, !hasGoshuin && styles.activeToggle]}
                onPress={() => setHasGoshuin(false)}
              >
                <Text style={[styles.toggleText, !hasGoshuin && styles.activeToggleText]}>
                  なし
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, hasGoshuin && styles.activeToggle]}
                onPress={() => setHasGoshuin(true)}
              >
                <Text style={[styles.toggleText, hasGoshuin && styles.activeToggleText]}>
                  あり
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <RatingSelector />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>お気に入り</Text>
            <TouchableOpacity
              style={[styles.favoriteButton, isFavorite && styles.activeFavoriteButton]}
              onPress={() => setIsFavorite(!isFavorite)}
            >
              <Text style={[styles.favoriteText, isFavorite && styles.activeFavoriteText]}>
                {isFavorite ? '❤️ お気に入り登録済み' : '🤍 お気に入りに登録'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>メモ・感想</Text>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="参拝の感想や思い出を記録..."
              placeholderTextColor="#999"
              multiline
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  shrineInfoContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  shrineInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  shrineInfoSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  shrineInfoAddress: {
    fontSize: 12,
    color: '#999',
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  notesInput: {
    height: 80,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeToggle: {
    backgroundColor: '#007AFF',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeToggleText: {
    color: '#fff',
  },
  ratingContainer: {
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starButton: {
    padding: 4,
  },
  star: {
    fontSize: 24,
    color: '#e0e0e0',
  },
  activeStar: {
    color: '#ffc107',
  },
  clearRatingButton: {
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearRatingText: {
    fontSize: 12,
    color: '#666',
  },
  favoriteButton: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  activeFavoriteButton: {
    backgroundColor: '#ffe6f2',
    borderColor: '#ff69b4',
  },
  favoriteText: {
    fontSize: 16,
    color: '#666',
  },
  activeFavoriteText: {
    color: '#ff69b4',
    fontWeight: '600',
  },
});