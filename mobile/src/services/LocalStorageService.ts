import AsyncStorage from '@react-native-async-storage/async-storage';
import { VisitRecord } from '../types';

/**
 * ローカルストレージを使用した参拝記録管理サービス
 * Phase 1: 完全にローカルでデータを管理
 */
class LocalStorageService {
  private static readonly VISIT_RECORDS_KEY = '@visit_records';
  private static readonly STORAGE_VERSION_KEY = '@storage_version';
  private static readonly CURRENT_VERSION = '1.0';

  /**
   * ストレージの初期化・バージョン確認
   */
  static async initialize(): Promise<void> {
    try {
      const version = await AsyncStorage.getItem(this.STORAGE_VERSION_KEY);
      if (version !== this.CURRENT_VERSION) {
        console.log('LocalStorage: Initializing storage...');
        await AsyncStorage.setItem(this.STORAGE_VERSION_KEY, this.CURRENT_VERSION);
        
        // 必要に応じてマイグレーション処理をここに追加
        if (!version) {
          // 初回起動時の処理
          await this.ensureVisitRecordsArray();
        }
      }
    } catch (error) {
      console.error('LocalStorage: Initialization failed:', error);
    }
  }

  /**
   * 参拝記録配列の存在確認・初期化
   */
  private static async ensureVisitRecordsArray(): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem(this.VISIT_RECORDS_KEY);
      if (!existing) {
        await AsyncStorage.setItem(this.VISIT_RECORDS_KEY, JSON.stringify([]));
        console.log('LocalStorage: Initialized empty visit records array');
      }
    } catch (error) {
      console.error('LocalStorage: Failed to ensure visit records array:', error);
    }
  }

  /**
   * 全ての参拝記録を取得
   */
  static async getVisitRecords(): Promise<VisitRecord[]> {
    try {
      const data = await AsyncStorage.getItem(this.VISIT_RECORDS_KEY);
      if (!data) {
        await this.ensureVisitRecordsArray();
        return [];
      }
      
      const records: VisitRecord[] = JSON.parse(data);
      
      // 参拝日順（新しい順）でソート
      records.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
      
      console.log(`LocalStorage: Retrieved ${records.length} visit records`);
      return records;
    } catch (error) {
      console.error('LocalStorage: Failed to get visit records:', error);
      return [];
    }
  }

  /**
   * 新しい参拝記録を作成
   */
  static async createVisitRecord(
    recordData: Omit<VisitRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<VisitRecord> {
    try {
      const records = await this.getVisitRecords();
      
      const newRecord: VisitRecord = {
        ...recordData,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      records.unshift(newRecord); // 先頭に追加（新しい順を維持）
      
      await AsyncStorage.setItem(this.VISIT_RECORDS_KEY, JSON.stringify(records));
      
      console.log(`LocalStorage: Created visit record: ${newRecord.id}`);
      return newRecord;
    } catch (error) {
      console.error('LocalStorage: Failed to create visit record:', error);
      throw new Error('参拝記録の保存に失敗しました');
    }
  }

  /**
   * 参拝記録を更新
   */
  static async updateVisitRecord(
    id: string,
    updates: Partial<Omit<VisitRecord, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<VisitRecord> {
    try {
      const records = await this.getVisitRecords();
      const index = records.findIndex(record => record.id === id);
      
      if (index === -1) {
        throw new Error('参拝記録が見つかりません');
      }

      const updatedRecord: VisitRecord = {
        ...records[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      records[index] = updatedRecord;
      
      await AsyncStorage.setItem(this.VISIT_RECORDS_KEY, JSON.stringify(records));
      
      console.log(`LocalStorage: Updated visit record: ${id}`);
      return updatedRecord;
    } catch (error) {
      console.error('LocalStorage: Failed to update visit record:', error);
      throw new Error('参拝記録の更新に失敗しました');
    }
  }

  /**
   * 参拝記録を削除
   */
  static async deleteVisitRecord(id: string): Promise<void> {
    try {
      const records = await this.getVisitRecords();
      const filteredRecords = records.filter(record => record.id !== id);
      
      if (filteredRecords.length === records.length) {
        throw new Error('参拝記録が見つかりません');
      }

      await AsyncStorage.setItem(this.VISIT_RECORDS_KEY, JSON.stringify(filteredRecords));
      
      console.log(`LocalStorage: Deleted visit record: ${id}`);
    } catch (error) {
      console.error('LocalStorage: Failed to delete visit record:', error);
      throw new Error('参拝記録の削除に失敗しました');
    }
  }

  /**
   * 特定の神社・寺院の参拝記録を検索
   */
  static async getVisitRecordsByShrineTemple(shrineTempleId: string): Promise<VisitRecord[]> {
    try {
      const records = await this.getVisitRecords();
      return records.filter(record => record.shrineTempleId === shrineTempleId);
    } catch (error) {
      console.error('LocalStorage: Failed to get records by shrine/temple:', error);
      return [];
    }
  }

  /**
   * 統計情報を取得
   */
  static async getStatistics(): Promise<{
    totalVisits: number;
    shrinesCount: number;
    templesCount: number;
    goshuinCount: number;
    averageRating: number;
  }> {
    try {
      const records = await this.getVisitRecords();
      
      const shrineVisits = records.filter(r => r.shrineTempleId.includes('shrine')).length;
      const templeVisits = records.length - shrineVisits;
      const goshuinCount = records.filter(r => r.hasGoshuin).length;
      
      const ratingsSum = records
        .filter(r => r.rating)
        .reduce((sum, r) => sum + (r.rating || 0), 0);
      const ratingsCount = records.filter(r => r.rating).length;
      const averageRating = ratingsCount > 0 ? ratingsSum / ratingsCount : 0;

      return {
        totalVisits: records.length,
        shrinesCount: shrineVisits,
        templesCount: templeVisits,
        goshuinCount,
        averageRating: Math.round(averageRating * 10) / 10, // 小数点1桁で四捨五入
      };
    } catch (error) {
      console.error('LocalStorage: Failed to get statistics:', error);
      return {
        totalVisits: 0,
        shrinesCount: 0,
        templesCount: 0,
        goshuinCount: 0,
        averageRating: 0,
      };
    }
  }

  /**
   * 全データのエクスポート（Phase 2用の準備）
   */
  static async exportData(): Promise<string> {
    try {
      const records = await this.getVisitRecords();
      const exportData = {
        version: this.CURRENT_VERSION,
        exportDate: new Date().toISOString(),
        visitRecords: records,
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('LocalStorage: Failed to export data:', error);
      throw new Error('データのエクスポートに失敗しました');
    }
  }

  /**
   * データのインポート（Phase 2用の準備）
   */
  static async importData(jsonData: string): Promise<number> {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.visitRecords || !Array.isArray(importData.visitRecords)) {
        throw new Error('無効なデータ形式です');
      }

      const existingRecords = await this.getVisitRecords();
      const existingIds = new Set(existingRecords.map(r => r.id));
      
      // 重複を避けて新しい記録のみ追加
      const newRecords = importData.visitRecords.filter(
        (record: VisitRecord) => !existingIds.has(record.id)
      );

      if (newRecords.length === 0) {
        return 0;
      }

      const allRecords = [...existingRecords, ...newRecords];
      await AsyncStorage.setItem(this.VISIT_RECORDS_KEY, JSON.stringify(allRecords));
      
      console.log(`LocalStorage: Imported ${newRecords.length} new records`);
      return newRecords.length;
    } catch (error) {
      console.error('LocalStorage: Failed to import data:', error);
      throw new Error('データのインポートに失敗しました');
    }
  }

  /**
   * ストレージの使用量を取得（デバッグ用）
   */
  static async getStorageInfo(): Promise<{
    recordsCount: number;
    storageSize: string;
  }> {
    try {
      const records = await this.getVisitRecords();
      const data = await AsyncStorage.getItem(this.VISIT_RECORDS_KEY);
      const sizeInBytes = data ? new Blob([data]).size : 0;
      const sizeInKB = Math.round(sizeInBytes / 1024 * 10) / 10;

      return {
        recordsCount: records.length,
        storageSize: `${sizeInKB} KB`,
      };
    } catch (error) {
      console.error('LocalStorage: Failed to get storage info:', error);
      return {
        recordsCount: 0,
        storageSize: '0 KB',
      };
    }
  }

  /**
   * ユニークIDの生成
   */
  private static generateId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `local_${timestamp}_${randomStr}`;
  }

  /**
   * 全データクリア（開発・テスト用）
   */
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.VISIT_RECORDS_KEY);
      await AsyncStorage.removeItem(this.STORAGE_VERSION_KEY);
      console.log('LocalStorage: All data cleared');
    } catch (error) {
      console.error('LocalStorage: Failed to clear data:', error);
      throw new Error('データのクリアに失敗しました');
    }
  }
}

export default LocalStorageService;