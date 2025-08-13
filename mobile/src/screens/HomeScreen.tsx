import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Alert,
  FlatList,
  Text,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { SearchBar } from '../components/SearchBar';
import { SimpleMapView } from '../components/SimpleMapView';
import { ShrineTempleCard } from '../components/ShrineTempleCard';
import { GoshuinImageModal } from '../components/GoshuinImageModal';
import { ShrineTemple, SearchFilters } from '../types';
import { apiService } from '../services/ApiService';

type ViewMode = 'list' | 'map';

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
  const [mapRegion, setMapRegion] = useState({
    latitude: TOKYO_STATION.latitude,
    longitude: TOKYO_STATION.longitude,
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

  // 起動時の位置情報取得
  const requestLocationAtStartup = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert(
        '位置情報の許可が必要です',
        '現在地周辺の神社・寺院を表示するには位置情報の許可が必要です。設定から許可してください。',
        [{ text: 'OK' }]
      );
      return;
    }

    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
        
        // 地図の中心を現在地に設定（5km圏内表示）
        setMapRegion({
          latitude,
          longitude,
          latitudeDelta: 0.09,
          longitudeDelta: 0.09,
        });
        
        // 位置情報取得成功時に5km圏内の寺院・神社を自動取得
        await loadNearbyTemples(latitude, longitude);
      },
      (error) => {
        console.log('Location error:', error);
        Alert.alert(
          '位置情報取得エラー',
          '現在地を取得できませんでした。東京駅を中心に表示します。\n\n設定 > プライバシーとセキュリティ > 位置情報サービス から許可を確認してください。',
          [{ text: 'OK' }]
        );
      },
      { 
        enableHighAccuracy: true,
        timeout: 15000, // 15秒でタイムアウト
        maximumAge: 60000 // 1分間キャッシュ
      }
    );
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: '位置情報の許可',
            message: '御朱印アプリが現在地を表示するために位置情報が必要です',
            buttonNeutral: '後で確認',
            buttonNegative: 'キャンセル',
            buttonPositive: '許可',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  // 起動時に一度だけ位置情報取得を試行
  useEffect(() => {
    requestLocationAtStartup();
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
        現在地から5km圏内の神社・寺院が{'\n'}自動で表示されます{'\n\n'}
        地名を検索してより詳しく{'\n'}探すこともできます
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