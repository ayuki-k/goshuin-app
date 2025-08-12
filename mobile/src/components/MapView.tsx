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
  const [region, setRegion] = useState(
    initialRegion || {
      latitude: 35.6762,
      longitude: 139.6503,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    }
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
    if (!hasPermission) return;

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
        Alert.alert('エラー', '現在地を取得できませんでした');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  useEffect(() => {
    getCurrentLocation();
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
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="現在地"
            pinColor="blue"
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