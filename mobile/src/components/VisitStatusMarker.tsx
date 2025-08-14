import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { ShrineTemple, VisitStatus } from '../types';
import { VisitStatusUtils, ExtendedVisitStatus } from '../utils/VisitStatusUtils';

interface VisitStatusMarkerProps {
  shrineTemple: ShrineTemple;
  visitStatus: ExtendedVisitStatus;
}

export const VisitStatusMarker: React.FC<VisitStatusMarkerProps> = ({
  shrineTemple,
  visitStatus,
}) => {
  // 新しい分離設計に基づくスタイル取得
  const getMarkerStyle = () => {
    const backgroundColor = VisitStatusUtils.getMarkerColor(shrineTemple, visitStatus);
    
    // ボーダー色の決定
    let borderColor = '#ddd';
    if (!visitStatus.isVisited) {
      if (visitStatus.isFavoriteIndependent) {
        borderColor = '#FF69B4'; // お気に入りピンク
      } else {
        borderColor = shrineTemple.type === 'shrine' ? '#FF6B6B' : '#4ECDC4';
      }
    } else if (visitStatus.hasGoshuin) {
      borderColor = '#FFD700'; // 金色
    } else {
      borderColor = '#28a745'; // 緑
    }

    return { backgroundColor, borderColor };
  };

  // メインアイコンは常に神社・寺院アイコン
  const mainIcon = VisitStatusUtils.getMainIcon(shrineTemple);
  
  // 複数のバッジを取得
  const statusBadges = VisitStatusUtils.getStatusBadges(visitStatus);

  const markerStyle = getMarkerStyle();

  return (
    <View style={styles.container}>
      {/* メインマーカー */}
      <View style={[
        styles.marker,
        {
          backgroundColor: markerStyle.backgroundColor,
          borderColor: markerStyle.borderColor,
        }
      ]}>
        <Text style={styles.mainIcon}>{mainIcon}</Text>
        
        {/* お気に入りハートを右下角に表示 */}
        {visitStatus.isFavoriteIndependent && (
          <View style={styles.favoriteOverlay}>
            <Text style={styles.favoriteOverlayIcon}>❤️</Text>
          </View>
        )}
      </View>

      {/* 参拝関連のバッジ（参拝済みの場合のみ右上に表示） */}
      {visitStatus.isVisited && (
        <View style={styles.visitBadge}>
          <Text style={styles.visitBadgeText}>
            {visitStatus.hasGoshuin ? '🏅' : '✅'}
          </Text>
        </View>
      )}

      {/* 複数回参拝の場合の回数表示 */}
      {visitStatus.visitCount > 1 && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{visitStatus.visitCount}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  mainIcon: {
    fontSize: 18,
  },
  favoriteOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    zIndex: 1,
  },
  favoriteOverlayIcon: {
    fontSize: 12,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  visitBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  visitBadgeText: {
    fontSize: 10,
  },
  countBadge: {
    position: 'absolute',
    top: -8,
    left: -8,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  countText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
});