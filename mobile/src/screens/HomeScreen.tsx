import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Alert,
  FlatList,
  Text,
} from 'react-native';
import { SearchBar } from '../components/SearchBar';
import { SimpleMapView } from '../components/SimpleMapView';
import { ShrineTempleCard } from '../components/ShrineTempleCard';
import { GoshuinImageModal } from '../components/GoshuinImageModal';
import { AddVisitFromShrineModal } from '../components/AddVisitFromShrineModal';
import { ShrineTemple, SearchFilters, VisitRecord } from '../types';
import { apiService } from '../services/ApiService';
import LocalStorageService from '../services/LocalStorageService';
import { VisitStatusUtils } from '../utils/VisitStatusUtils';

type ViewMode = 'list' | 'map';

interface LocationState {
  latitude: number;
  longitude: number;
  isLocationPermissionGranted: boolean;
  locationError?: string;
}

interface HomeScreenProps {
  currentLocation: LocationState;
  isLocationInitialized: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  currentLocation,
  isLocationInitialized,
}) => {
  const [shrineTemples, setShrineTemples] = useState<ShrineTemple[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedShrine, setSelectedShrine] = useState<ShrineTemple | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [visitRecords, setVisitRecords] = useState<VisitRecord[]>([]);
  const [showVisitPaths, setShowVisitPaths] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showAddVisitModal, setShowAddVisitModal] = useState(false);
  const [selectedShrineForVisit, setSelectedShrineForVisit] = useState<ShrineTemple | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: currentLocation.latitude,
    longitude: currentLocation.longitude,
    latitudeDelta: 0.09,
    longitudeDelta: 0.09,
  });

  // 検索結果の中心座標を計算
  const calculateSearchResultsCenter = (temples: ShrineTemple[]) => {
    console.log(`calculateSearchResultsCenter: Processing ${temples.length} temples`);
    if (temples.length === 0) return null;

    // 有効な座標を持つ寺院・神社のみフィルター
    const validTemples = temples.filter(temple => temple.lat && temple.lng);
    console.log(`calculateSearchResultsCenter: ${validTemples.length} temples have valid coordinates`);
    
    if (validTemples.length === 0) {
      console.log('calculateSearchResultsCenter: No valid coordinates found');
      return null;
    }

    // 中心座標を計算（単純平均）
    const totalLat = validTemples.reduce((sum, temple) => sum + Number(temple.lat), 0);
    const totalLng = validTemples.reduce((sum, temple) => sum + Number(temple.lng), 0);
    
    const centerLat = totalLat / validTemples.length;
    const centerLng = totalLng / validTemples.length;

    // 適切なズームレベルを計算（範囲に基づく）
    const latitudes = validTemples.map(t => Number(t.lat));
    const longitudes = validTemples.map(t => Number(t.lng));
    
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    
    const latDelta = Math.max((maxLat - minLat) * 1.5, 0.01); // 最小ズーム制限
    const lngDelta = Math.max((maxLng - minLng) * 1.5, 0.01);

    console.log(`Search results center: (${centerLat}, ${centerLng}), Delta: (${latDelta}, ${lngDelta})`);
    console.log(`Coordinate range: Lat(${minLat} - ${maxLat}), Lng(${minLng} - ${maxLng})`);

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.min(latDelta, 1.0), // 最大ズーム制限
      longitudeDelta: Math.min(lngDelta, 1.0),
    };
  };

  // 5km圏内の寺院・神社を自動取得
  const loadNearbyTemples = async (latitude: number, longitude: number) => {
    try {
      setLoading(true);
      const nearbyTemples = await apiService.getNearbyTemples(latitude, longitude, 5);
      setShrineTemples(nearbyTemples);
      console.log(`HomeScreen: Loaded ${nearbyTemples.length} nearby temples within 5km`);
    } catch (error) {
      console.error('HomeScreen: Error loading nearby temples:', error);
      // エラー時は空の配列を設定（地図は表示される）
      setShrineTemples([]);
    } finally {
      setLoading(false);
    }
  };

  // 参拝記録の取得
  const loadVisitRecords = async () => {
    try {
      const records = await LocalStorageService.getVisitRecords();
      setVisitRecords(records);
      console.log(`HomeScreen: Loaded ${records.length} visit records`);
    } catch (error) {
      console.error('HomeScreen: Error loading visit records:', error);
    }
  };

  // 参拝記録の追加（神社・寺院情報付き）
  const handleAddVisitFromShrine = async (visitData: Omit<VisitRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newRecord = await LocalStorageService.createVisitRecord(visitData);
      setVisitRecords(prev => [newRecord, ...prev]);
      setShowAddVisitModal(false);
      setSelectedShrineForVisit(null);
      Alert.alert('登録完了', '参拝記録を登録しました');
    } catch (error) {
      console.error('Failed to add visit record:', error);
      Alert.alert('エラー', '参拝記録の登録に失敗しました');
    }
  };

  // 位置情報が利用可能で許可されている場合のみ、5km圏内の寺院を自動取得
  useEffect(() => {
    if (isLocationInitialized && currentLocation.isLocationPermissionGranted) {
      console.log('HomeScreen: Location initialized, loading nearby temples');
      loadNearbyTemples(currentLocation.latitude, currentLocation.longitude);
    }
    // 参拝記録も同時に読み込む
    loadVisitRecords();
  }, [isLocationInitialized, currentLocation]);

  // アプリがフォーカスされた時に参拝記録を再読み込み（他の画面で削除された場合に対応）
  useEffect(() => {
    const interval = setInterval(() => {
      loadVisitRecords();
    }, 5000); // 5秒ごとに更新

    return () => clearInterval(interval);
  }, []);

  const handleSearch = async (filters: SearchFilters) => {
    setLoading(true);
    try {
      // 現在地付近検索の場合（テキスト入力なし）
      if (filters.isNearbySearch) {
        console.log('Nearby search: showing temples within 5km of current location');
        
        // 現在地付近5kmの寺院・神社を取得
        await loadNearbyTemples(currentLocation.latitude, currentLocation.longitude);
        
        // 地図を現在地に戻す
        setMapRegion({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.09,
          longitudeDelta: 0.09,
        });
        
        setNetworkError(false);
        console.log('Showing nearby temples within 5km of current location');
        return;
      }

      // 地名が指定されている場合は検索を実行（5km制限なし）
      console.log('Location search: searching by prefecture/city with filters:', filters);
      const results = await apiService.searchShrineTemples(filters);
      setShrineTemples(results);
      setNetworkError(false);
      
      console.log(`Search completed: Found ${results.length} results`);
      
      // 検索結果がある場合、地図の中心を検索結果の場所に移動
      if (results.length > 0) {
        console.log('Sample search result:', results[0]);
        const searchCenter = calculateSearchResultsCenter(results);
        if (searchCenter) {
          setMapRegion(searchCenter);
          console.log(`Map moved to search results: ${JSON.stringify(searchCenter)}`);
        } else {
          console.log('calculateSearchResultsCenter returned null');
        }
      } else {
        console.log('No search results found, returning to current location');
        // 検索結果がない場合は現在地に戻す
        setMapRegion({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.09,
          longitudeDelta: 0.09,
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      setNetworkError(true);
      Alert.alert('エラー', '検索に失敗しました。ネットワーク接続を確認してください。');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (shrine: ShrineTemple) => {
    // 参拝ステータスを取得
    const visitStatus = VisitStatusUtils.getVisitStatus(shrine, visitRecords);
    
    const buttons = [
      { text: 'キャンセル', style: 'cancel' as const },
      { 
        text: visitStatus.isVisited ? '参拝記録を追加' : '参拝記録を作成',
        onPress: () => {
          setSelectedShrineForVisit(shrine);
          setShowAddVisitModal(true);
        }
      },
      { text: '詳細を見る', onPress: () => handleCardPress(shrine) },
    ];

    if (shrine.photoUrl) {
      buttons.splice(-1, 0, {
        text: '御朱印を見る',
        onPress: () => {
          setSelectedShrine(shrine);
          setImageModalVisible(true);
        },
      });
    }

    Alert.alert(
      shrine.name,
      VisitStatusUtils.getStatusDescription(shrine, visitStatus),
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
      visitRecords={visitRecords}
      onAddVisit={(shrine) => {
        setSelectedShrineForVisit(shrine);
        setShowAddVisitModal(true);
      }}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      {currentLocation.isLocationPermissionGranted ? (
        <Text style={styles.emptyText}>
          現在地から5km圏内の神社・寺院が{'\n'}自動で表示されます{'\n\n'}
          地名を検索してより詳しく{'\n'}探すこともできます
        </Text>
      ) : (
        <View>
          <Text style={styles.emptyText}>
            地名を検索して神社・寺院を{'\n'}探すことができます
          </Text>
          {currentLocation.locationError && (
            <Text style={styles.locationError}>
              {'\n'}位置情報: {currentLocation.locationError}
            </Text>
          )}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <SearchBar onSearch={handleSearch} loading={loading} />
      
      <View style={styles.toggleContainer}>
        {networkError && (
          <View style={styles.networkStatus}>
            <Text style={styles.networkStatusText}>
              ⚠️ ネットワーク接続なし - オフラインモード
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
            style={[styles.toggleButton, viewMode === 'map' && styles.activeToggle]}
            onPress={() => setViewMode('map')}
          >
            🗺️ 地図
          </Text>
        </View>
        {viewMode === 'map' && visitRecords.length > 0 && (
          <View style={styles.pathToggleContainer}>
            <View style={styles.mapControls}>
              <Text
                style={[styles.pathToggleButton, showVisitPaths && styles.activePathToggle]}
                onPress={() => setShowVisitPaths(!showVisitPaths)}
              >
                {showVisitPaths ? '📍 経路非表示' : '🔗 参拝経路'}
              </Text>
              <Text
                style={[styles.pathToggleButton, showStatistics && styles.activePathToggle]}
                onPress={() => setShowStatistics(!showStatistics)}
              >
                {showStatistics ? '📈 統計非表示' : '📊 参拝統計'}
              </Text>
            </View>
          </View>
        )}
        {viewMode === 'map' && showStatistics && visitRecords.length > 0 && (
          <View style={styles.statisticsContainer}>
            {(() => {
              const stats = VisitStatusUtils.calculateVisitStatistics(shrineTemples, visitRecords);
              return (
                <View style={styles.statisticsContent}>
                  <Text style={styles.statisticsTitle}>📊 参拝統計</Text>
                  <View style={styles.statisticsRow}>
                    <View style={styles.statisticsItem}>
                      <Text style={styles.statisticsNumber}>{stats.visitedShrines}</Text>
                      <Text style={styles.statisticsLabel}>参拝数</Text>
                    </View>
                    <View style={styles.statisticsItem}>
                      <Text style={styles.statisticsNumber}>{stats.goshuinCollected}</Text>
                      <Text style={styles.statisticsLabel}>御朱印</Text>
                    </View>
                    <View style={styles.statisticsItem}>
                      <Text style={styles.statisticsNumber}>{stats.favoriteCount}</Text>
                      <Text style={styles.statisticsLabel}>お気に入り</Text>
                    </View>
                    <View style={styles.statisticsItem}>
                      <Text style={styles.statisticsNumber}>{stats.visitRate}%</Text>
                      <Text style={styles.statisticsLabel}>達成率</Text>
                    </View>
                  </View>
                </View>
              );
            })()}
          </View>
        )}
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
          <SimpleMapView
            shrineTemples={shrineTemples}
            onMarkerPress={handleMarkerPress}
            initialRegion={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.09, // 約5km圏内を表示 (1度≈111km なので 5km≈0.045度、余裕をもって0.09)
              longitudeDelta: 0.09,
            }}
            isOffline={networkError}
            mapRegion={mapRegion}
            visitRecords={visitRecords}
            showVisitPaths={showVisitPaths}
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

      <AddVisitFromShrineModal
        visible={showAddVisitModal}
        shrineTemple={selectedShrineForVisit}
        onClose={() => {
          setShowAddVisitModal(false);
          setSelectedShrineForVisit(null);
        }}
        onSave={handleAddVisitFromShrine}
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
  locationError: {
    fontSize: 12,
    color: '#d32f2f',
    textAlign: 'center',
    lineHeight: 18,
  },
  pathToggleContainer: {
    marginTop: 8,
  },
  mapControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  pathToggleButton: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
    backgroundColor: '#f0f8ff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  activePathToggle: {
    backgroundColor: '#007AFF',
    color: '#fff',
  },
  statisticsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statisticsContent: {
    padding: 12,
  },
  statisticsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  statisticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statisticsItem: {
    alignItems: 'center',
  },
  statisticsNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statisticsLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
});