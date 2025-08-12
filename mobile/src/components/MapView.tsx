import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import { ShrineTemple } from '../types';

interface MapProps {
  shrineTemples: ShrineTemple[];
  onMarkerPress?: (shrine: ShrineTemple) => void;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
}

export const GoshuinMapView: React.FC<MapProps> = ({
  shrineTemples,
  onMarkerPress,
  initialRegion,
}) => {
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  // 東京駅の座標をデフォルトに設定
  const TOKYO_STATION = {
    latitude: 35.6812, // 東京駅の正確な座標
    longitude: 139.7671,
    latitudeDelta: 0.5, // 関東地方全体が見える範囲
    longitudeDelta: 0.5,
  };

  const [region, setRegion] = useState(
    initialRegion || TOKYO_STATION
  );

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

  const getCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      // 権限がない場合は東京駅を中心に設定
      setRegion(TOKYO_STATION);
      return;
    }

    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      },
      (error) => {

        console.error('Location error:', error);
        // 現在地取得に失敗した場合は東京駅を中心に設定
        setRegion(TOKYO_STATION);
        Alert.alert(
          '位置情報',
          '現在地を取得できませんでした。東京駅を中心に表示します。',
          [{ text: 'OK' }]
        );
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, // タイムアウトを10秒に短縮
        maximumAge: 10000 
      }
    );
  };

  useEffect(() => {
    // 初期化時にまず東京駅を設定し、その後現在地取得を試行
    setRegion(TOKYO_STATION);
    
    // 少し遅延させて現在地取得を開始
    const timer = setTimeout(() => {
      getCurrentLocation();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getMarkerColor = (shrineTemple: ShrineTemple): string => {
    return shrineTemple.type === 'shrine' ? '#FF6B6B' : '#4ECDC4';
  };

  const getMarkerTitle = (shrineTemple: ShrineTemple): string => {
    const typeIcon = shrineTemple.type === 'shrine' ? '⛩️' : '🏯';
    return `${typeIcon} ${shrineTemple.name}`;
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        mapType="standard"
      >
        {currentLocation ? (
          <Marker
            coordinate={currentLocation}
            title="現在地"
            pinColor="blue"
          />
        ) : (
          <Marker
            coordinate={TOKYO_STATION}
            title="東京駅"
            description="位置情報が取得できないため、東京駅を表示中"
            pinColor="orange"
          />
        )}
        
        {shrineTemples
          .filter(shrine => shrine.lat && shrine.lng)
          .map((shrine) => (
            <Marker
              key={shrine.id}
              coordinate={{
                latitude: shrine.lat!,
                longitude: shrine.lng!,
              }}
              title={getMarkerTitle(shrine)}
              description={`${shrine.address || `${shrine.prefecture} ${shrine.city}`}`}
              pinColor={getMarkerColor(shrine)}
              onPress={() => onMarkerPress?.(shrine)}
            />
          ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});