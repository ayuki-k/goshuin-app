import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { ShrineTemple } from '../types';
import { offlineShrineTemples } from '../data/offlineData';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface OfflineMapViewProps {
  shrineTemples: ShrineTemple[];
  onMarkerPress?: (shrine: ShrineTemple) => void;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
}

// 日本の地域座標マッピング（簡略化）
const REGION_COORDINATES = {
  Tokyo: { x: 0.6, y: 0.5 },
  Kanagawa: { x: 0.58, y: 0.52 },
  Chiba: { x: 0.62, y: 0.48 },
  Saitama: { x: 0.56, y: 0.46 },
  Osaka: { x: 0.52, y: 0.57 },
  Kyoto: { x: 0.50, y: 0.55 },
  Nara: { x: 0.51, y: 0.58 },
  Hiroshima: { x: 0.42, y: 0.60 },
  Fukuoka: { x: 0.25, y: 0.77 },
  Hokkaido: { x: 0.50, y: 0.20 },
};

export const OfflineMapView: React.FC<OfflineMapViewProps> = ({
  shrineTemples,
  onMarkerPress,
  currentLocation,
}) => {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  
  // オフライン時は検索結果がない場合、サンプルデータを表示
  const displayData = shrineTemples.length > 0 ? shrineTemples : offlineShrineTemples;

  const getMarkerPosition = (prefecture: string) => {
    const coord = REGION_COORDINATES[prefecture as keyof typeof REGION_COORDINATES];
    if (!coord) return { x: 0.5, y: 0.5 }; // デフォルト位置
    return coord;
  };

  const getMarkerColor = (shrineTemple: ShrineTemple) => {
    return shrineTemple.type === 'shrine' ? '#FF6B6B' : '#4ECDC4';
  };

  const getMarkerIcon = (shrineTemple: ShrineTemple) => {
    return shrineTemple.type === 'shrine' ? '⛩️' : '🏯';
  };

  const renderShrineMaker = (shrine: ShrineTemple, index: number) => {
    const position = getMarkerPosition(shrine.prefecture);
    const left = position.x * (screenWidth * 0.9) - 15;
    const top = position.y * 300 - 15;

    return (
      <TouchableOpacity
        key={shrine.id}
        style={[
          styles.marker,
          {
            left: Math.max(0, Math.min(left, screenWidth * 0.9 - 30)),
            top: Math.max(0, Math.min(top, 300 - 30)),
            backgroundColor: getMarkerColor(shrine),
          },
        ]}
        onPress={() => onMarkerPress?.(shrine)}
      >
        <Text style={styles.markerIcon}>{getMarkerIcon(shrine)}</Text>
      </TouchableOpacity>
    );
  };

  const renderCurrentLocationMarker = () => {
    if (!currentLocation) return null;

    // 現在地を大まかな地域にマッピング（東京駅なら東京）
    const position = getMarkerPosition('Tokyo');
    const left = position.x * (screenWidth * 0.9) - 12;
    const top = position.y * 300 - 12;

    return (
      <View
        style={[
          styles.currentLocationMarker,
          {
            left: Math.max(0, Math.min(left, screenWidth * 0.9 - 24)),
            top: Math.max(0, Math.min(top, 300 - 24)),
          },
        ]}
      >
        <View style={styles.currentLocationDot} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🗾 日本地図（オフライン）</Text>
        <Text style={styles.subtitle}>
          {shrineTemples.length > 0
            ? `${shrineTemples.length}件の神社・寺院`
            : `${offlineShrineTemples.length}件のサンプル神社・寺院`}
        </Text>
      </View>

      <ScrollView style={styles.mapContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.mapContent}>
          {/* 日本地図の背景 */}
          <View style={styles.mapBackground}>
            {/* 北海道 */}
            <View style={[styles.region, styles.hokkaido]}>
              <Text style={styles.regionLabel}>北海道</Text>
            </View>

            {/* 本州 */}
            <View style={[styles.region, styles.honshu]}>
              <Text style={styles.regionLabel}>本州</Text>
              
              {/* 関東地方 */}
              <View style={[styles.subRegion, styles.kanto]}>
                <Text style={styles.subRegionLabel}>関東</Text>
              </View>

              {/* 関西地方 */}
              <View style={[styles.subRegion, styles.kansai]}>
                <Text style={styles.subRegionLabel}>関西</Text>
              </View>
            </View>

            {/* 四国 */}
            <View style={[styles.region, styles.shikoku]}>
              <Text style={styles.regionLabel}>四国</Text>
            </View>

            {/* 九州 */}
            <View style={[styles.region, styles.kyushu]}>
              <Text style={styles.regionLabel}>九州</Text>
            </View>
          </View>

          {/* 神社・寺院マーカー */}
          {displayData.map((shrine, index) => renderShrineMaker(shrine, index))}

          {/* 現在地マーカー */}
          {renderCurrentLocationMarker()}
        </View>
      </ScrollView>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendMarker, { backgroundColor: '#FF6B6B' }]} />
          <Text style={styles.legendText}>⛩️ 神社</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendMarker, { backgroundColor: '#4ECDC4' }]} />
          <Text style={styles.legendText}>🏯 寺院</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.currentLocationLegend} />
          <Text style={styles.legendText}>📍 現在地</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  mapContainer: {
    flex: 1,
  },
  mapContent: {
    minHeight: screenHeight * 0.6,
    position: 'relative',
  },
  mapBackground: {
    width: screenWidth * 0.9,
    height: 400,
    alignSelf: 'center',
    backgroundColor: '#c6e2f0',
    borderRadius: 12,
    margin: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  region: {
    position: 'absolute',
    backgroundColor: '#e8f4f8',
    borderWidth: 2,
    borderColor: '#4a90a4',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hokkaido: {
    top: '10%',
    left: '40%',
    width: '20%',
    height: '15%',
  },
  honshu: {
    top: '30%',
    left: '20%',
    width: '60%',
    height: '35%',
  },
  shikoku: {
    top: '55%',
    left: '35%',
    width: '15%',
    height: '10%',
  },
  kyushu: {
    top: '65%',
    left: '15%',
    width: '20%',
    height: '25%',
  },
  subRegion: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kanto: {
    top: '20%',
    right: '10%',
    width: '35%',
    height: '40%',
  },
  kansai: {
    top: '40%',
    left: '15%',
    width: '30%',
    height: '35%',
  },
  regionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4a90a4',
    textAlign: 'center',
  },
  subRegionLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  marker: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerIcon: {
    fontSize: 14,
  },
  currentLocationMarker: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  currentLocationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  currentLocationLegend: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});