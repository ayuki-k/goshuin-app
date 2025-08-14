import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { VisitRecord } from '../types';

interface VisitRecordCardProps {
  visitRecord: VisitRecord;
  onPress: (visitRecord: VisitRecord) => void;
  onDelete?: (visitRecord: VisitRecord) => void;
}

export const VisitRecordCard: React.FC<VisitRecordCardProps> = ({
  visitRecord,
  onPress,
  onDelete,
}) => {
  // 日付フォーマット（YYYY-MM-DD → MM/DD）
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    } catch {
      return dateString;
    }
  };

  // 評価の星表示
  const renderRating = (rating?: number) => {
    if (!rating) return null;
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(visitRecord)}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.shrineTemple}>{visitRecord.shrineTempleName}</Text>
          {visitRecord.hasGoshuin && (
            <View style={styles.goshuinBadge}>
              <Text style={styles.goshuinText}>御朱印</Text>
            </View>
          )}
          {visitRecord.isFavorite && (
            <Text style={styles.favoriteIcon}>❤️</Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.visitDate}>{formatDate(visitRecord.visitDate)}</Text>
          {onDelete && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={(e) => {
                e.stopPropagation();
                onDelete(visitRecord);
              }}
            >
              <Text style={styles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {visitRecord.rating && (
        <View style={styles.ratingContainer}>
          <Text style={styles.rating}>{renderRating(visitRecord.rating)}</Text>
        </View>
      )}

      {visitRecord.notes && (
        <Text style={styles.notes} numberOfLines={2}>
          {visitRecord.notes}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  shrineTemple: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  goshuinBadge: {
    backgroundColor: '#28a745',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  goshuinText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  visitDate: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  favoriteIcon: {
    fontSize: 14,
    marginLeft: 4,
  },
  deleteButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#f8f8f8',
  },
  deleteButtonText: {
    fontSize: 12,
  },
  ratingContainer: {
    marginBottom: 8,
  },
  rating: {
    fontSize: 14,
    color: '#ffc107',
  },
  notes: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});