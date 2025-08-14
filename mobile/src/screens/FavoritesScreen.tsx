import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ShrineTemple, VisitRecord } from '../types';
import FavoriteStorageService, { FavoriteItem } from '../services/FavoriteStorageService';
import LocalStorageService from '../services/LocalStorageService';
import { VisitStatusUtils, ExtendedVisitStatus } from '../utils/VisitStatusUtils';

interface FavoriteCardProps {
  favorite: FavoriteItem;
  visitStatus: ExtendedVisitStatus;
  onPress: () => void;
  onRemove: (favorite: FavoriteItem) => void;
}

const FavoriteCard: React.FC<FavoriteCardProps> = ({
  favorite,
  visitStatus,
  onPress,
  onRemove,
}) => {
  const getTypeIcon = (type: 'shrine' | 'temple') => {
    return type === 'shrine' ? '⛩️' : '🏯';
  };

  const getTypeText = (type: 'shrine' | 'temple') => {
    return type === 'shrine' ? '神社' : '寺院';
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.icon}>{getTypeIcon(favorite.type)}</Text>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{favorite.shrineTempleName}</Text>
            <Text style={styles.type}>{getTypeText(favorite.type)}</Text>
            
            {/* ステータス表示 */}
            <View style={styles.statusContainer}>
              <Text style={styles.favoriteStatus}>❤️ お気に入り</Text>
              {visitStatus.isVisited && (
                <Text style={styles.visitStatus}>
                  {visitStatus.hasGoshuin ? '🏅 御朱印取得済み' : '✅ 参拝済み'}
                  {visitStatus.visitCount > 1 && ` (${visitStatus.visitCount}回)`}
                </Text>
              )}
            </View>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.removeButton}
          onPress={(e) => {
            e.stopPropagation();
            onRemove(favorite);
          }}
        >
          <Text style={styles.removeButtonText}>削除</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.locationContainer}>
        <Text style={styles.location}>
          📍 {favorite.prefecture} {favorite.city}
        </Text>
        {favorite.address && (
          <Text style={styles.address}>{favorite.address}</Text>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.addedDate}>
          追加日: {new Date(favorite.createdAt).toLocaleDateString('ja-JP')}
        </Text>
        {!visitStatus.isVisited && (
          <Text style={styles.unvisitedHint}>タップで詳細を見る</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const FavoritesScreen: React.FC = () => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [visitRecords, setVisitRecords] = useState<VisitRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // お気に入りの取得
  const loadFavorites = async () => {
    setLoading(true);
    try {
      const favs = await FavoriteStorageService.getFavorites();
      setFavorites(favs);
      console.log(`FavoritesScreen: Loaded ${favs.length} favorites`);
    } catch (error) {
      console.error('FavoritesScreen: Error loading favorites:', error);
      Alert.alert('エラー', 'お気に入りの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 参拝記録の取得
  const loadVisitRecords = async () => {
    try {
      const records = await LocalStorageService.getVisitRecords();
      setVisitRecords(records);
      console.log(`FavoritesScreen: Loaded ${records.length} visit records`);
    } catch (error) {
      console.error('FavoritesScreen: Error loading visit records:', error);
    }
  };

  useEffect(() => {
    loadFavorites();
    loadVisitRecords();
  }, []);

  // お気に入りの削除
  const handleRemoveFavorite = (favorite: FavoriteItem) => {
    Alert.alert(
      '削除確認',
      `「${favorite.shrineTempleName}」をお気に入りから削除しますか？`,
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await FavoriteStorageService.removeFavorite(favorite.shrineTempleId);
              await loadFavorites();
              Alert.alert('削除完了', 'お気に入りから削除しました');
            } catch (error) {
              console.error('Failed to remove favorite:', error);
              Alert.alert('エラー', 'お気に入りの削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  // お気に入り詳細表示
  const handleFavoritePress = (favorite: FavoriteItem) => {
    const visitStatus = VisitStatusUtils.getVisitStatus(
      // FavoriteItemからShrineTempleの形に変換
      {
        id: favorite.shrineTempleId,
        name: favorite.shrineTempleName,
        type: favorite.type,
        prefecture: favorite.prefecture,
        city: favorite.city,
        address: favorite.address,
        lat: favorite.lat,
        lng: favorite.lng,
        hasGoshuin: false,
        source: 'favorite',
        updatedAt: new Date().toISOString(),
      } as ShrineTemple,
      visitRecords,
      favorites
    );

    const statusParts: string[] = ['❤️ お気に入り'];
    
    if (visitStatus.isVisited) {
      if (visitStatus.visitCount > 1) {
        statusParts.push(`${visitStatus.visitCount}回参拝`);
      } else {
        statusParts.push('参拝済み');
      }
      if (visitStatus.hasGoshuin) {
        statusParts.push('🏅 御朱印あり');
      }
    } else {
      statusParts.push('未参拝');
    }

    const message = [
      `種別: ${favorite.type === 'shrine' ? '神社' : '寺院'}`,
      `所在地: ${favorite.prefecture} ${favorite.city}`,
      favorite.address && `住所: ${favorite.address}`,
      `追加日: ${new Date(favorite.createdAt).toLocaleDateString('ja-JP')}`,
      `ステータス: ${statusParts.join(' • ')}`,
    ]
      .filter(Boolean)
      .join('\n');

    Alert.alert(favorite.shrineTempleName, message, [{ text: '閉じる' }]);
  };

  const renderFavorite = ({ item }: { item: FavoriteItem }) => {
    // FavoriteItemからShrineTempleの形に変換してステータスを取得
    const shrineTemple: ShrineTemple = {
      id: item.shrineTempleId,
      name: item.shrineTempleName,
      type: item.type,
      prefecture: item.prefecture,
      city: item.city,
      address: item.address,
      lat: item.lat,
      lng: item.lng,
      hasGoshuin: false, // デフォルト値
      source: 'favorite', // 必須プロパティ
      updatedAt: new Date().toISOString(), // 必須プロパティ
    };
    
    const visitStatus = VisitStatusUtils.getVisitStatus(shrineTemple, visitRecords, favorites);
    
    return (
      <FavoriteCard
        favorite={item}
        visitStatus={visitStatus}
        onPress={() => handleFavoritePress(item)}
        onRemove={handleRemoveFavorite}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>❤️</Text>
      <Text style={styles.emptyText}>
        まだお気に入りがありません{'\n\n'}
        気になる神社や寺院を{'\n'}
        お気に入りに追加してみましょう
      </Text>
      <Text style={styles.emptyHint}>
        💡 地図やリストから❤️ボタンで{'\n'}
        お気に入りに追加できます
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>お気に入り</Text>
        <Text style={styles.headerSubtitle}>
          {favorites.length > 0 && `${favorites.length}件`}
        </Text>
      </View>

      <FlatList
        data={favorites}
        renderItem={renderFavorite}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={favorites.length === 0 ? styles.emptyContainer : styles.listContainer}
        refreshing={loading}
        onRefresh={() => {
          loadFavorites();
          loadVisitRecords();
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  emptyHint: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  icon: {
    fontSize: 24,
    marginRight: 8,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 22,
  },
  type: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusContainer: {
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  favoriteStatus: {
    fontSize: 11,
    color: '#FF69B4',
    fontWeight: '500',
  },
  visitStatus: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '500',
  },
  removeButton: {
    backgroundColor: '#ff4757',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  locationContainer: {
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  address: {
    fontSize: 12,
    color: '#888',
    paddingLeft: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  addedDate: {
    fontSize: 11,
    color: '#888',
  },
  unvisitedHint: {
    fontSize: 10,
    color: '#007AFF',
    fontStyle: 'italic',
  },
});