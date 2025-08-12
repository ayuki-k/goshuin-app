import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_GOOGLE } from 'react-native-maps';
import { ShrineTemple } from '../types';

interface OfflineTileMapProps {
  shrineTemples: ShrineTemple[];
  onMarkerPress?: (shrine: ShrineTemple) => void;
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  tileUrl: string; // 例: "http://localhost:8080/tiles/{z}/{x}/{y}.png"
}

export const OfflineTileMapView: React.FC<OfflineTileMapProps> = ({
  shrineTemples,
  onMarkerPress,
  initialRegion,
  tileUrl,
}) => {
  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={initialRegion}
        mapType="none"
      >
        <UrlTile
          urlTemplate={tileUrl}
          maximumZ={19}
          flipY={false}
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
              title={shrine.name}
              description={shrine.address || `${shrine.prefecture} ${shrine.city}`}
              pinColor={shrine.type === 'shrine' ? '#FF6B6B' : '#4ECDC4'}
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
