import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { VisitRecord, ShrineTemple } from '../types';
import { VisitRecordCard } from '../components/VisitRecordCard';
import { AddVisitModal } from '../components/AddVisitModal';
import LocalStorageService from '../services/LocalStorageService';

export const VisitRecordsScreen: React.FC = () => {
  const [visitRecords, setVisitRecords] = useState<VisitRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // 参拝記録の取得（ローカルストレージから）
  const loadVisitRecords = async () => {
    setLoading(true);
    try {
      const records = await LocalStorageService.getVisitRecords();
      setVisitRecords(records);
      console.log(`Loaded ${records.length} visit records from local storage`);
    } catch (error) {
      console.error('Failed to load visit records:', error);
      Alert.alert('エラー', '参拝記録の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisitRecords();
  }, []);

  // 参拝記録の追加（ローカルストレージに保存）
  const handleAddVisit = async (visitData: Omit<VisitRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newRecord = await LocalStorageService.createVisitRecord(visitData);
      setVisitRecords(prev => [newRecord, ...prev]);
      setShowAddModal(false);
      Alert.alert('登録完了', '参拝記録を登録しました');
    } catch (error) {
      console.error('Failed to add visit record:', error);
      Alert.alert('エラー', '参拝記録の登録に失敗しました');
    }
  };

  // 参拝記録の削除
  const handleDeleteVisit = (visitRecord: VisitRecord) => {
    Alert.alert(
      '削除確認',
      `「${visitRecord.shrineTempleName}」の参拝記録を削除しますか？\n\n参拝日: ${visitRecord.visitDate}`,
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await LocalStorageService.deleteVisitRecord(visitRecord.id);
              setVisitRecords(prev => prev.filter(record => record.id !== visitRecord.id));
              Alert.alert('削除完了', '参拝記録を削除しました');
            } catch (error) {
              console.error('Failed to delete visit record:', error);
              Alert.alert('エラー', '参拝記録の削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const renderVisitRecord = ({ item }: { item: VisitRecord }) => (
    <VisitRecordCard
      visitRecord={item}
      onPress={() => {
        // TODO: 詳細画面への遷移
        Alert.alert(item.shrineTempleName, `参拝日: ${item.visitDate}`);
      }}
      onDelete={handleDeleteVisit}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🏛️</Text>
      <Text style={styles.emptyText}>
        まだ参拝記録がありません{'\n\n'}
        神社や寺院を参拝したら{'\n'}
        記録を残してみましょう
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.addButtonText}>📝 参拝記録を追加</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>参拝記録</Text>
        {visitRecords.length > 0 && (
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.headerButtonText}>＋</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={visitRecords}
        renderItem={renderVisitRecord}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={visitRecords.length === 0 ? styles.emptyContainer : styles.listContainer}
        refreshing={loading}
        onRefresh={loadVisitRecords}
      />

      <AddVisitModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddVisit}
      />
    </SafeAreaView>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 32,
    alignItems: 'center',
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});