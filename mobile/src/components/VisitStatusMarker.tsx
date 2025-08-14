import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { ShrineTemple, VisitStatus } from '../types';

interface VisitStatusMarkerProps {
  shrineTemple: ShrineTemple;
  visitStatus: VisitStatus;
}

export const VisitStatusMarker: React.FC<VisitStatusMarkerProps> = ({
  shrineTemple,
  visitStatus,
}) => {
  // 参拝ステータスに応じたスタイルを取得
  const getMarkerStyle = () => {
    if (!visitStatus.isVisited) {
      // 未参拝: デフォルトカラー（少し薄く）
      return {
        backgroundColor: shrineTemple.type === 'shrine' ? '#ffebee' : '#e0f2f1',
        borderColor: shrineTemple.type === 'shrine' ? '#FF6B6B' : '#4ECDC4',
      };
    }

    // 参拝済み: より鮮やかな色
    if (visitStatus.hasGoshuin) {
      return {
        backgroundColor: '#fff8e1', // 薄い金色背景
        borderColor: '#FFD700', // 金色ボーダー
      };
    }

    if (visitStatus.isFavorite) {
      return {
        backgroundColor: '#fce4ec', // 薄いピンク背景
        borderColor: '#FF69B4', // ピンクボーダー
      };
    }

    // 参拝済み: 薄い緑背景
    return {
      backgroundColor: '#e8f5e8',
      borderColor: '#28a745',
    };
  };

  // メインアイコンは常に神社・寺院アイコン
  const getMainIcon = () => {
    return shrineTemple.type === 'shrine' ? '⛩️' : '🏯';
  };

  // 参拝ステータスバッジを取得（優先順位: 御朱印 > お気に入り > 参拝済み）
  const getStatusBadge = () => {
    if (!visitStatus.isVisited) return null;

    if (visitStatus.hasGoshuin) {
      return '🏅'; // 御朱印取得済み
    }
    
    if (visitStatus.isFavorite) {
      return '❤️'; // お気に入り
    }

    return '✅'; // 参拝済み
  };

  const markerStyle = getMarkerStyle();
  const mainIcon = getMainIcon();
  const statusBadge = getStatusBadge();

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
      </View>

      {/* ステータスバッジ（参拝済みの場合のみ） */}
      {statusBadge && (
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>{statusBadge}</Text>
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
  statusBadge: {
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
  statusBadgeText: {
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