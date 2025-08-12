import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Alert,
  FlatList,
  Text,
} from 'react-native';
import { SearchBar } from '../components/SearchBar';
import { GoshuinMapView } from '../components/MapView';
import { ShrineTempleCard } from '../components/ShrineTempleCard';
import { ShrineTemple, SearchFilters } from '../types';
import { apiService } from '../services/ApiService';

type ViewMode = 'list' | 'map';

export const HomeScreen: React.FC = () => {
  const [shrineTemples, setShrineTemples] = useState<ShrineTemple[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const handleSearch = async (filters: SearchFilters) => {
    setLoading(true);
    try {
      const results = await apiService.searchShrineTemples(filters);
      setShrineTemples(results);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('エラー', '検索に失敗しました。ネットワーク接続を確認してください。');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (shrine: ShrineTemple) => {
    Alert.alert(
      shrine.name,
      `${shrine.prefecture} ${shrine.city}\n${shrine.hasGoshuin ? '御朱印あり' : '御朱印なし'}`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '詳細を見る', onPress: () => handleCardPress(shrine) },
      ]
    );
  };

  const handleCardPress = (shrine: ShrineTemple) => {
    const message = [
      `種別: ${shrine.type === 'shrine' ? '神社' : '寺院'}`,
      `所在地: ${shrine.prefecture} ${shrine.city}`,
      shrine.address && `住所: ${shrine.address}`,
      shrine.hasGoshuin ? '御朱印: あり' : '御朱印: なし',
      shrine.hours_notes && `参拝時間: ${shrine.hours_notes}`,
      shrine.specialPeriod && `特記: ${shrine.specialPeriod}`,
      shrine.officialUrl && '公式サイト: あり',
    ]
      .filter(Boolean)
      .join('\n');

    Alert.alert(shrine.name, message, [{ text: '閉じる' }]);
  };

  const renderShrineTemple = ({ item }: { item: ShrineTemple }) => (
    <ShrineTempleCard
      shrineTemple={item}
      onPress={() => handleCardPress(item)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>
        地名を検索して御朱印をもらえる{'\n'}神社・寺院を見つけましょう
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <SearchBar onSearch={handleSearch} loading={loading} />
      
      <View style={styles.toggleContainer}>
        <View style={styles.toggleButtons}>
          <Text
            style={[styles.toggleButton, viewMode === 'list' && styles.activeToggle]}
            onPress={() => setViewMode('list')}
          >
            📝 リスト
          </Text>
          <Text
            style={[styles.toggleButton, viewMode === 'map' && styles.activeToggle]}
            onPress={() => setViewMode('map')}
          >
            🗺️ 地図
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {viewMode === 'list' ? (
          <FlatList
            data={shrineTemples}
            renderItem={renderShrineTemple}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={shrineTemples.length === 0 ? styles.emptyContainer : undefined}
          />
        ) : (
          <GoshuinMapView
            shrineTemples={shrineTemples}
            onMarkerPress={handleMarkerPress}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  toggleContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  toggleButtons: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    borderRadius: 6,
  },
  activeToggle: {
    backgroundColor: '#007AFF',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});