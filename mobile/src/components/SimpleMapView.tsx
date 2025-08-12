import React from 'react';
import {
  View,
  StyleSheet,
  Text,
} from 'react-native';
import MapView, { Marker, UrlTile, Circle } from 'react-native-maps';
import { ShrineTemple } from '../types';

interface SimpleMapProps {
  shrineTemples: ShrineTemple[];
  onMarkerPress?: (shrine: ShrineTemple) => void;
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  isOffline?: boolean;
}

export const SimpleMapView: React.FC<SimpleMapProps> = ({
  shrineTemples = [],
  onMarkerPress,
  initialRegion,
  isOffline = false,
}) => {
  const getMarkerColor = (shrineTemple: ShrineTemple): string => {
    return shrineTemple.type === 'shrine' ? '#FF6B6B' : '#4ECDC4';
  };

  const getMarkerTitle = (shrineTemple: ShrineTemple): string => {
    const typeIcon = shrineTemple.type === 'shrine' ? '⛩️' : '🏯';
    return `${typeIcon} ${shrineTemple.name}`;
  };

  // 安全性チェック
  if (!initialRegion || typeof initialRegion.latitude !== 'number' || typeof initialRegion.longitude !== 'number') {
    console.error('SimpleMapView: Invalid initialRegion', initialRegion);
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>地図を読み込めませんでした</Text>
        </View>
      </View>
    );
  }

  console.log('SimpleMapView render: isOffline=', isOffline, 'region=', initialRegion);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        mapType="standard"
        loadingEnabled={true}
        loadingIndicatorColor="#666"
        loadingBackgroundColor="#eeeeee"
      >
        {/* OpenStreetMap タイル（オンライン時） */}
        {!isOffline && (
          <UrlTile
            urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            minimumZ={1}
            subdomains={['a', 'b', 'c']}
            shouldReplaceMapContent={false}
            opacity={0.8}
          />
        )}
        
        {/* 5km圏内を示すサークル */}
        <Circle
          center={{
            latitude: initialRegion.latitude,
            longitude: initialRegion.longitude,
          }}
          radius={5000} // 5km = 5000m
          strokeColor="rgba(0, 122, 255, 0.5)"
          fillColor="rgba(0, 122, 255, 0.1)"
          strokeWidth={2}
        />
        
        {/* 現在地マーカー */}
        <Marker
          coordinate={{
            latitude: initialRegion.latitude,
            longitude: initialRegion.longitude,
          }}
          title="📍 現在地"
          description="5km圏内の神社・寺院を表示"
          pinColor="blue"
        />
        
        {/* 神社・寺院マーカー */}
        {Array.isArray(shrineTemples) && shrineTemples
          .filter(shrine => shrine && shrine.lat && shrine.lng && shrine.id)
          .map((shrine) => {
            try {
              const lat = Number(shrine.lat);
              const lng = Number(shrine.lng);
              
              if (isNaN(lat) || isNaN(lng)) {
                console.warn('Invalid coordinates for shrine:', shrine.id, lat, lng);
                return null;
              }
              
              return (
                <Marker
                  key={shrine.id}
                  coordinate={{
                    latitude: lat,
                    longitude: lng,
                  }}
                  title={getMarkerTitle(shrine)}
                  description={shrine.address || `${shrine.prefecture || ''} ${shrine.city || ''}`}
                  pinColor={getMarkerColor(shrine)}
                  onPress={() => onMarkerPress?.(shrine)}
                />
              );
            } catch (error) {
              console.error('Error rendering marker for shrine:', shrine.id, error);
              return null;
            }
          })
          .filter(Boolean)}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});