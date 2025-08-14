import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import MapView, { Marker, UrlTile, Circle, Polyline } from 'react-native-maps';
import { ShrineTemple, VisitRecord, VisitStatus } from '../types';
import { VisitPathUtils, VisitPath } from '../utils/VisitPathUtils';
import { VisitStatusUtils } from '../utils/VisitStatusUtils';
import { VisitStatusMarker } from './VisitStatusMarker';
import { MapLegend } from './MapLegend';

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
  mapRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  visitRecords?: VisitRecord[]; // 参拝記録（経路表示用）
  showVisitPaths?: boolean; // 参拝経路の表示フラグ
}

export const SimpleMapView: React.FC<SimpleMapProps> = ({
  shrineTemples = [],
  onMarkerPress,
  initialRegion,
  isOffline = false,
  mapRegion,
  visitRecords = [],
  showVisitPaths = false,
}) => {
  const getVisitStatus = (shrineTemple: ShrineTemple): VisitStatus => {
    return VisitStatusUtils.getVisitStatus(shrineTemple, visitRecords);
  };

  const getMarkerColor = (shrineTemple: ShrineTemple, visitStatus: VisitStatus): string => {
    return VisitStatusUtils.getMarkerColor(shrineTemple, visitStatus);
  };

  const getMarkerTitle = (shrineTemple: ShrineTemple, visitStatus: VisitStatus): string => {
    const icon = VisitStatusUtils.getMarkerIcon(shrineTemple, visitStatus);
    return `${icon} ${shrineTemple.name}`;
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

  // 現在の地図領域を管理
  const [currentRegion, setCurrentRegion] = React.useState(initialRegion);
  const [showLegend, setShowLegend] = React.useState(false);
  
  // mapRegionが更新された時に地図を移動
  React.useEffect(() => {
    if (mapRegion) {
      setCurrentRegion(mapRegion);
      console.log('SimpleMapView: Map region updated to:', mapRegion);
    }
  }, [mapRegion]);

  // 参拝経路を計算
  const visitPaths: VisitPath[] = React.useMemo(() => {
    if (!showVisitPaths || visitRecords.length < 2) {
      return [];
    }
    
    console.log('SimpleMapView: Generating visit paths from', visitRecords.length, 'records');
    return VisitPathUtils.generateVisitPaths(visitRecords, shrineTemples);
  }, [showVisitPaths, visitRecords, shrineTemples]);

  console.log('SimpleMapView render: isOffline=', isOffline, 'region=', currentRegion, 'paths=', visitPaths.length);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={currentRegion}
        onRegionChangeComplete={setCurrentRegion}
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
            urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            minimumZ={1}
            shouldReplaceMapContent={false}
            opacity={0.8}
          />
        )}
        
        {/* 現在地が表示される場合のみ5km圏内サークルを表示 */}
        {!mapRegion && (
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
        )}
        
        {/* 現在地マーカー（検索時は非表示） */}
        {!mapRegion && (
          <Marker
            coordinate={{
              latitude: initialRegion.latitude,
              longitude: initialRegion.longitude,
            }}
            title="📍 現在地"
            description="5km圏内の神社・寺院を表示"
            pinColor="blue"
          />
        )}
        
        {/* 参拝経路の線 */}
        {visitPaths.map((path) => (
          <Polyline
            key={path.id}
            coordinates={path.points.map(point => ({
              latitude: point.latitude,
              longitude: point.longitude,
            }))}
            strokeColor={path.color}
            strokeWidth={3}
            lineDashPattern={[5, 5]} // 破線スタイル
          />
        ))}

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

              // この神社・寺院の参拝ステータスを取得
              const visitStatus = getVisitStatus(shrine);
              
              return (
                <Marker
                  key={shrine.id}
                  coordinate={{
                    latitude: lat,
                    longitude: lng,
                  }}
                  title={getMarkerTitle(shrine, visitStatus)}
                  description={VisitStatusUtils.getStatusDescription(shrine, visitStatus)}
                  onPress={() => onMarkerPress?.(shrine)}
                >
                  <VisitStatusMarker
                    shrineTemple={shrine}
                    visitStatus={visitStatus}
                  />
                </Marker>
              );
            } catch (error) {
              console.error('Error rendering marker for shrine:', shrine.id, error);
              return null;
            }
          })
          .filter(Boolean)}

        {/* 参拝順序番号マーカー */}
        {showVisitPaths && visitPaths.flatMap(path =>
          path.points.map((point, index) => (
            <Marker
              key={`order-${path.id}-${point.visitRecord.id}`}
              coordinate={{
                latitude: point.latitude,
                longitude: point.longitude,
              }}
              title={`${point.order}. ${point.shrineTemple?.name || point.visitRecord.shrineTempleName}`}
              description={`参拝日: ${point.visitDate}`}
            >
              <View style={styles.orderMarker}>
                <Text style={styles.orderText}>{point.order}</Text>
              </View>
            </Marker>
          ))
        )}
      </MapView>
      
      {/* 凡例 */}
      <MapLegend
        visible={showLegend}
        onToggle={() => setShowLegend(!showLegend)}
      />
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
  orderMarker: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  orderText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});