/**
 * Goshuin Helper App
 * React Native app for finding shrines and temples with Goshuin
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View, Text, TouchableOpacity, Alert, Platform, PermissionsAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { HomeScreen } from './src/screens/HomeScreen';
import { VisitRecordsScreen } from './src/screens/VisitRecordsScreen';
import LocalStorageService from './src/services/LocalStorageService';
import { SearchFilters } from './src/types';

// エラーバウンダリーコンポーネント
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('ErrorBoundary caught an error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary componentDidCatch:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={[styles.container, styles.errorContainer]}>
          <Text style={styles.errorTitle}>アプリでエラーが発生しました</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || '不明なエラー'}
          </Text>
          <Text style={styles.errorMessage}>
            アプリを再起動してください
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

type TabType = 'search' | 'records' | 'settings';

// 東京駅の座標（フォールバック位置）
const TOKYO_STATION = {
  latitude: 35.6812,
  longitude: 139.7671,
};

interface LocationState {
  latitude: number;
  longitude: number;
  isLocationPermissionGranted: boolean;
  locationError?: string;
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const [location, setLocation] = useState<LocationState>({
    latitude: TOKYO_STATION.latitude,
    longitude: TOKYO_STATION.longitude,
    isLocationPermissionGranted: false,
    locationError: undefined,
  });
  const [isLocationInitialized, setIsLocationInitialized] = useState(false);
  
  // 検索状態をアプリレベルで管理
  const [lastSearchFilters, setLastSearchFilters] = useState<SearchFilters | null>(null);

  console.log('App: Starting render');

  // 位置情報許可の要求
  const requestLocationPermission = async (): Promise<boolean> => {
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

  // アプリ起動時の位置情報取得
  const initializeLocation = async () => {
    console.log('App: Initializing location...');
    
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      console.log('App: Location permission denied');
      setLocation(prev => ({
        ...prev,
        isLocationPermissionGranted: false,
        locationError: '位置情報の許可が拒否されました',
      }));
      setIsLocationInitialized(true);
      return;
    }

    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log(`App: Location acquired: (${latitude}, ${longitude})`);
        setLocation({
          latitude,
          longitude,
          isLocationPermissionGranted: true,
          locationError: undefined,
        });
        setIsLocationInitialized(true);
      },
      (error) => {
        console.log('App: Location error:', error);
        setLocation(prev => ({
          ...prev,
          isLocationPermissionGranted: false,
          locationError: `位置情報の取得に失敗しました: ${error.message}`,
        }));
        setIsLocationInitialized(true);
      },
      { 
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  };

  // アプリ起動時の初期化
  useEffect(() => {
    const initializeApp = async () => {
      // ローカルストレージの初期化
      await LocalStorageService.initialize();
      
      // 位置情報の初期化
      initializeLocation();
    };

    initializeApp();
  }, []);

  const renderContent = () => {
    // 位置情報の初期化中はローディング表示
    if (!isLocationInitialized) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>位置情報を取得中...</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'search':
        return (
          <HomeScreen 
            currentLocation={location}
            isLocationInitialized={isLocationInitialized}
            lastSearchFilters={lastSearchFilters}
            onSearchFiltersChange={setLastSearchFilters}
          />
        );
      case 'records':
        return <VisitRecordsScreen />;
      case 'settings':
        return (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>設定画面（今後実装予定）</Text>
            {location.locationError && (
              <Text style={styles.locationErrorText}>
                位置情報: {location.locationError}
              </Text>
            )}
          </View>
        );
      default:
        return (
          <HomeScreen 
            currentLocation={location}
            isLocationInitialized={isLocationInitialized}
            lastSearchFilters={lastSearchFilters}
            onSearchFiltersChange={setLastSearchFilters}
          />
        );
    }
  };

  const TabButton: React.FC<{ tab: TabType; icon: string; label: string }> = ({ tab, icon, label }) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[styles.tabIcon, activeTab === tab && styles.activeTabIcon]}>{icon}</Text>
      <Text style={[styles.tabLabel, activeTab === tab && styles.activeTabLabel]}>{label}</Text>
    </TouchableOpacity>
  );

  try {
    return (
      <ErrorBoundary>
        <View style={styles.container}>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <View style={styles.content}>
            {renderContent()}
          </View>
          <View style={styles.tabBar}>
            <TabButton tab="search" icon="🔍" label="検索" />
            <TabButton tab="records" icon="📖" label="参拝記録" />
            <TabButton tab="settings" icon="⚙️" label="設定" />
          </View>
        </View>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('App render error:', error);
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorTitle}>初期化エラー</Text>
        <Text style={styles.errorMessage}>
          アプリの初期化に失敗しました
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 20, // SafeAreaのための余白
    paddingTop: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTabButton: {
    // アクティブ時の背景色は不要
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  activeTabIcon: {
    // アクティブ時は色を変更しない（絵文字のため）
  },
  tabLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#007AFF',
    fontWeight: '600',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  locationErrorText: {
    fontSize: 12,
    color: '#d32f2f',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
});

export default App;
