import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShrineTemple } from '../types';

export interface FavoriteItem {
  id: string;
  shrineTempleId: string;
  shrineTempleName: string;
  prefecture: string;
  city: string;
  type: 'shrine' | 'temple';
  address?: string;
  lat?: number;
  lng?: number;
  createdAt: string;
}

class FavoriteStorageService {
  private static readonly STORAGE_KEY = '@favorite_items';

  static async getFavorites(): Promise<FavoriteItem[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (jsonValue) {
        const favorites = JSON.parse(jsonValue);
        console.log(`FavoriteStorageService: Loaded ${favorites.length} favorites`);
        return favorites;
      }
      return [];
    } catch (error) {
      console.error('FavoriteStorageService: Failed to load favorites:', error);
      return [];
    }
  }

  static async addFavorite(shrineTemple: ShrineTemple): Promise<FavoriteItem> {
    try {
      const favorites = await this.getFavorites();
      
      // 既にお気に入りに追加されているかチェック
      const existingFavorite = favorites.find(fav => fav.shrineTempleId === shrineTemple.id);
      if (existingFavorite) {
        console.log('FavoriteStorageService: Already in favorites:', shrineTemple.id);
        return existingFavorite;
      }

      const newFavorite: FavoriteItem = {
        id: `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        shrineTempleId: shrineTemple.id,
        shrineTempleName: shrineTemple.name,
        prefecture: shrineTemple.prefecture,
        city: shrineTemple.city,
        type: shrineTemple.type,
        address: shrineTemple.address,
        lat: shrineTemple.lat,
        lng: shrineTemple.lng,
        createdAt: new Date().toISOString(),
      };

      const updatedFavorites = [newFavorite, ...favorites];
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedFavorites));
      
      console.log('FavoriteStorageService: Added favorite:', newFavorite.id);
      return newFavorite;
    } catch (error) {
      console.error('FavoriteStorageService: Failed to add favorite:', error);
      throw error;
    }
  }

  static async removeFavorite(shrineTempleId: string): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      const updatedFavorites = favorites.filter(fav => fav.shrineTempleId !== shrineTempleId);
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedFavorites));
      console.log('FavoriteStorageService: Removed favorite:', shrineTempleId);
    } catch (error) {
      console.error('FavoriteStorageService: Failed to remove favorite:', error);
      throw error;
    }
  }

  static async isFavorite(shrineTempleId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      return favorites.some(fav => fav.shrineTempleId === shrineTempleId);
    } catch (error) {
      console.error('FavoriteStorageService: Failed to check favorite status:', error);
      return false;
    }
  }

  static async getFavoriteById(shrineTempleId: string): Promise<FavoriteItem | null> {
    try {
      const favorites = await this.getFavorites();
      return favorites.find(fav => fav.shrineTempleId === shrineTempleId) || null;
    } catch (error) {
      console.error('FavoriteStorageService: Failed to get favorite by id:', error);
      return null;
    }
  }

  static async clearAllFavorites(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('FavoriteStorageService: Cleared all favorites');
    } catch (error) {
      console.error('FavoriteStorageService: Failed to clear favorites:', error);
      throw error;
    }
  }
}

export default FavoriteStorageService;