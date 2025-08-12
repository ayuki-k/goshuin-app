import React, { useState } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { ShrineTemple } from '../types';

interface OSMMapProps {
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

export const OpenStreetMapView: React.FC<OSMMapProps> = ({
  shrineTemples,
  onMarkerPress,
  initialRegion,
  isOffline = false,
}) => {
  const [region, setRegion] = useState(initialRegion);

  // initialRegionが変更されたら地図の表示領域も更新
  React.useEffect(() => {
    setRegion(initialRegion);
    console.log('OpenStreetMapView: Region updated:', initialRegion);
    console.log('OpenStreetMapView: isOffline:', isOffline);
  }, [initialRegion, isOffline]);

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
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        mapType={isOffline ? "standard" : "none"}
        minZoomLevel={3}
        maxZoomLevel={18}
      >
        {/* OpenStreetMap タイルレイヤー（オンライン時のみ） */}
        {!isOffline && (
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={18}
            minimumZ={3}
            flipY={false}
            shouldReplaceMapContent={true}
            opacity={1.0}
          />
        )}
        
        {/* 現在地マーカー */}
        <Marker
          coordinate={{
            latitude: initialRegion.latitude,
            longitude: initialRegion.longitude,
          }}
          title="現在地"
          description="現在地または起動時の位置"
          pinColor="blue"
        />
        
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