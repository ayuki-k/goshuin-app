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
import { OpenStreetMapView } from '../components/OpenStreetMapView';
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
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
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
      const results = await apiService.searchShrineTemples(filters);
      setShrineTemples(results);
      setNetworkError(false);
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
          <OpenStreetMapView
            shrineTemples={shrineTemples}
            onMarkerPress={handleMarkerPress}
            initialRegion={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.5,
              longitudeDelta: 0.5,
            }}
            isOffline={networkError}
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