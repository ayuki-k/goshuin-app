import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Alert,
  FlatList,
  Text,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { SearchBar } from '../components/SearchBar';
import { GoshuinMapView } from '../components/MapView';
import { OfflineMapView } from '../components/OfflineMapView';
import { OfflineTileMapView } from '../components/OfflineTileMapView';
import { ShrineTempleCard } from '../components/ShrineTempleCard';
import { GoshuinImageModal } from '../components/GoshuinImageModal';
import { ShrineTemple, SearchFilters } from '../types';
import { apiService } from '../services/ApiService';

type ViewMode = 'list' | 'map' | 'offline';

// 東京駅の座標（フォールバック位置）
const TOKYO_STATION = {
  latitude: 35.6812,
  longitude: 139.7671,
};

export const HomeScreen: React.FC = () => {
  const [shrineTemples, setShrineTemples] = useState<ShrineTemple[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedShrine, setSelectedShrine] = useState<ShrineTemple | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(TOKYO_STATION);
  const [networkError, setNetworkError] = useState(false);
  // オフライン地図方式の切り替え（true: タイル, false: イラスト）
  const [useTileOfflineMap, setUseTileOfflineMap] = useState(false);
  // オフラインタイルサーバーのURL（例: ローカルサーバーや端末内）
  const offlineTileUrl = 'http://localhost:8080/tiles/{z}/{x}/{y}.png';

  // 現在地取得（フォールバック付き）
  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
      },
      (error) => {
        console.log('Location error:', error);
        // エラー時は東京駅のままにする（既にデフォルト値）
        setCurrentLocation(TOKYO_STATION);
      },
      { 
        enableHighAccuracy: false, // バッテリー節約
        timeout: 10000,
        maximumAge: 300000 // 5分間キャッシュ
      }
    );
  };

  // 初期化時に現在地取得を試行
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const handleSearch = async (filters: SearchFilters) => {
    setLoading(true);
    try {
      const results = await apiService.searchShrineTemples(filters);
      setShrineTemples(results);
      setNetworkError(false);
    } catch (error) {
      console.error('Search error:', error);
      setNetworkError(true);
      
      // ネットワークエラー時は自動的にオフライン地図に切り替え
      if (viewMode === 'map') {
        setViewMode('offline');
        Alert.alert(
          'ネットワークエラー', 
          'ネットワーク接続がありません。オフライン地図に切り替えました。'
        );
      } else {
        Alert.alert('エラー', '検索に失敗しました。ネットワーク接続を確認してください。');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (shrine: ShrineTemple) => {
    const buttons = [
      { text: 'キャンセル', style: 'cancel' as const },
      { text: '詳細を見る', onPress: () => handleCardPress(shrine) },
    ];

    if (shrine.photoUrl) {
      buttons.splice(1, 0, {
        text: '御朱印を見る',
        onPress: () => {
          setSelectedShrine(shrine);
          setImageModalVisible(true);
        },
      });
    }

    Alert.alert(
      shrine.name,
      `${shrine.prefecture} ${shrine.city}\n${shrine.hasGoshuin ? '御朱印あり' : '御朱印なし'}`,
      buttons
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
        {networkError && (
          <View style={styles.networkStatus}>
            <Text style={styles.networkStatusText}>
              ⚠️ ネットワーク接続なし - オフラインモードを推奨
            </Text>
          </View>
        )}
        <View style={styles.toggleButtons}>
          <Text
            style={[styles.toggleButton, viewMode === 'list' && styles.activeToggle]}
            onPress={() => setViewMode('list')}
          >
            📝 リスト
          </Text>
          <Text
            style={[
              styles.toggleButton, 
              viewMode === 'map' && styles.activeToggle,
              networkError && styles.disabledToggle
            ]}
            onPress={() => {
              if (networkError) {
                Alert.alert(
                  'ネットワークエラー',
                  'オンライン地図はネットワーク接続が必要です。オフライン地図をお使いください。'
                );
              } else {
                setViewMode('map');
              }
            }}
          >
            🗺️ 地図 {networkError && '(無効)'}
          </Text>
          <Text
            style={[styles.toggleButton, viewMode === 'offline' && styles.activeToggle]}
            onPress={() => setViewMode('offline')}
          >
            🗾 オフライン
          </Text>
          <Text
            style={[styles.toggleButton, useTileOfflineMap && styles.activeToggle]}
            onPress={() => setUseTileOfflineMap(!useTileOfflineMap)}
          >
            🗾 タイル地図
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
        ) : viewMode === 'map' ? (
          <GoshuinMapView
            shrineTemples={shrineTemples}
            onMarkerPress={handleMarkerPress}
            initialRegion={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.5,
              longitudeDelta: 0.5,
            }}
          />
        ) : useTileOfflineMap ? (
          <OfflineTileMapView
            shrineTemples={shrineTemples}
            onMarkerPress={handleMarkerPress}
            initialRegion={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.5,
              longitudeDelta: 0.5,
            }}
            tileUrl={offlineTileUrl}
          />
        ) : (
          <OfflineMapView
            shrineTemples={shrineTemples}
            onMarkerPress={handleMarkerPress}
            currentLocation={currentLocation}
          />
        )}
      </View>

      <GoshuinImageModal
        visible={imageModalVisible}
        shrineTemple={selectedShrine}
        onClose={() => {
          setImageModalVisible(false);
          setSelectedShrine(null);
        }}
      />
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
  disabledToggle: {
    opacity: 0.5,
    color: '#999',
  },
  networkStatus: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffeaa7',
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
  },
  networkStatusText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
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