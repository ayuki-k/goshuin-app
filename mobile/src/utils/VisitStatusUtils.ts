import { VisitRecord, ShrineTemple, VisitStatus } from '../types';
import { FavoriteItem } from '../services/FavoriteStorageService';

export interface ExtendedVisitStatus extends VisitStatus {
  isFavoriteIndependent: boolean; // 独立したお気に入り状態
}

/**
 * 参拝ステータス管理のユーティリティクラス
 */
export class VisitStatusUtils {
  /**
   * 神社・寺院の参拝ステータスを計算（お気に入り機能分離版）
   */
  static getVisitStatus(
    shrineTemple: ShrineTemple,
    visitRecords: VisitRecord[],
    favorites: FavoriteItem[] = []
  ): ExtendedVisitStatus {
    // この神社・寺院の参拝記録をすべて取得
    const shrineVisitRecords = visitRecords.filter(
      record => record.shrineTempleId === shrineTemple.id
    );

    // 独立したお気に入り状態をチェック
    const isFavoriteIndependent = favorites.some(fav => fav.shrineTempleId === shrineTemple.id);

    if (shrineVisitRecords.length === 0) {
      // 未参拝
      return {
        isVisited: false,
        hasGoshuin: false,
        isFavorite: false, // 従来のお気に入り（参拝記録ベース）
        isFavoriteIndependent, // 独立したお気に入り
        visitCount: 0,
      };
    }

    // 最新の参拝記録を取得（日付順でソート）
    const sortedRecords = shrineVisitRecords.sort(
      (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
    );
    const latestRecord = sortedRecords[0];

    // 御朱印取得の有無（いずれかの参拝で取得していればtrue）
    const hasGoshuin = shrineVisitRecords.some(record => record.hasGoshuin);

    // 従来のお気に入りの有無（最新記録のお気に入り状態）
    const isFavorite = latestRecord.isFavorite || false;

    return {
      isVisited: true,
      hasGoshuin,
      isFavorite, // 従来のお気に入り（参拝記録ベース）
      isFavoriteIndependent, // 独立したお気に入り
      visitCount: shrineVisitRecords.length,
      lastVisitDate: latestRecord.visitDate,
      visitRecord: latestRecord,
    };
  }

  /**
   * 従来のgetVisitStatus（後方互換性のため）
   */
  static getVisitStatusLegacy(
    shrineTemple: ShrineTemple,
    visitRecords: VisitRecord[]
  ): VisitStatus {
    const extendedStatus = this.getVisitStatus(shrineTemple, visitRecords, []);
    const { isFavoriteIndependent, ...legacyStatus } = extendedStatus;
    return legacyStatus;
  }

  /**
   * 参拝ステータスに応じたマーカーの色を取得（新しい分離設計対応）
   */
  static getMarkerColor(
    shrineTemple: ShrineTemple,
    visitStatus: ExtendedVisitStatus
  ): string {
    if (!visitStatus.isVisited) {
      // 未参拝の場合、お気に入りかどうかで色を変える
      if (visitStatus.isFavoriteIndependent) {
        return '#fce4ec'; // 薄いピンク（お気に入りの未参拝）
      }
      // 通常の未参拝: デフォルトの色（神社は赤、寺院は青緑）
      return shrineTemple.type === 'shrine' ? '#ffebee' : '#e0f2f1';
    }

    // 参拝済みの場合、御朱印の有無が最優先
    if (visitStatus.hasGoshuin) {
      // 御朱印取得済み: 金色
      return '#fff8e1';
    }

    // 参拝済み（御朱印なし）: 薄い緑
    return '#e8f5e8';
  }

  /**
   * 従来のgetMarkerColor（後方互換性のため）
   */
  static getMarkerColorLegacy(
    shrineTemple: ShrineTemple,
    visitStatus: VisitStatus
  ): string {
    const extendedStatus: ExtendedVisitStatus = {
      ...visitStatus,
      isFavoriteIndependent: false,
    };
    return this.getMarkerColor(shrineTemple, extendedStatus);
  }

  /**
   * 参拝ステータスに応じたバッジ（小さなメダル）を取得
   */
  static getStatusBadges(visitStatus: ExtendedVisitStatus): string[] {
    const badges: string[] = [];
    
    // 独立したお気に入り状態（未参拝でも表示）
    if (visitStatus.isFavoriteIndependent) {
      badges.push('❤️');
    }
    
    // 参拝関連のバッジ（参拝済みの場合のみ）
    if (visitStatus.isVisited) {
      if (visitStatus.hasGoshuin) {
        badges.push('🏅'); // 御朱印取得済み
      } else {
        badges.push('✅'); // 参拝済み
      }
    }

    return badges;
  }

  /**
   * 神社・寺院のメインアイコンを取得（常に神社・寺院アイコン）
   */
  static getMainIcon(shrineTemple: ShrineTemple): string {
    return shrineTemple.type === 'shrine' ? '⛩️' : '🏯';
  }

  /**
   * 従来のgetMarkerIcon（後方互換性のため）
   */
  static getMarkerIcon(
    shrineTemple: ShrineTemple,
    visitStatus: VisitStatus
  ): string {
    // 従来のロジックを維持
    const baseIcon = shrineTemple.type === 'shrine' ? '⛩️' : '🏯';
    
    if (!visitStatus.isVisited) {
      return baseIcon;
    }

    if (visitStatus.hasGoshuin) {
      return '🏅';
    }

    if (visitStatus.isFavorite) {
      return '❤️';
    }

    return '✅';
  }

  /**
   * 参拝ステータスの説明文を生成（新しい分離設計対応）
   */
  static getStatusDescription(
    shrineTemple: ShrineTemple,
    visitStatus: ExtendedVisitStatus
  ): string {
    const baseInfo = `${shrineTemple.name}\n${shrineTemple.prefecture} ${shrineTemple.city}`;
    
    const statusParts: string[] = [];
    
    // 独立したお気に入り状態
    if (visitStatus.isFavoriteIndependent) {
      statusParts.push('❤️ お気に入り');
    }
    
    if (!visitStatus.isVisited) {
      statusParts.push('未参拝');
      return `${baseInfo}\n${statusParts.join(' • ')}`;
    }

    // 参拝状態
    if (visitStatus.visitCount > 1) {
      statusParts.push(`${visitStatus.visitCount}回参拝`);
    } else {
      statusParts.push('参拝済み');
    }

    if (visitStatus.hasGoshuin) {
      statusParts.push('🏅 御朱印あり');
    }

    if (visitStatus.lastVisitDate) {
      const lastVisit = new Date(visitStatus.lastVisitDate).toLocaleDateString('ja-JP');
      statusParts.push(`最終参拝: ${lastVisit}`);
    }

    return `${baseInfo}\n${statusParts.join(' • ')}`;
  }

  /**
   * 従来のgetStatusDescription（後方互換性のため）
   */
  static getStatusDescriptionLegacy(
    shrineTemple: ShrineTemple,
    visitStatus: VisitStatus
  ): string {
    const extendedStatus: ExtendedVisitStatus = {
      ...visitStatus,
      isFavoriteIndependent: false,
    };
    return this.getStatusDescription(shrineTemple, extendedStatus);
  }

  /**
   * 参拝統計を計算（新しい分離設計対応）
   */
  static calculateVisitStatistics(
    shrineTemples: ShrineTemple[],
    visitRecords: VisitRecord[],
    favorites: FavoriteItem[] = []
  ): {
    totalShrines: number;
    visitedShrines: number;
    goshuinCollected: number;
    favoriteCount: number; // 独立したお気に入り数
    visitRate: number;
  } {
    const visitedShrineIds = new Set(visitRecords.map(record => record.shrineTempleId));
    const goshuinShrineIds = new Set(
      visitRecords.filter(record => record.hasGoshuin).map(record => record.shrineTempleId)
    );

    const totalShrines = shrineTemples.length;
    const visitedShrines = visitedShrineIds.size;
    const goshuinCollected = goshuinShrineIds.size;
    const favoriteCount = favorites.length; // 独立したお気に入り数
    const visitRate = totalShrines > 0 ? Math.round((visitedShrines / totalShrines) * 100) : 0;

    return {
      totalShrines,
      visitedShrines,
      goshuinCollected,
      favoriteCount,
      visitRate,
    };
  }

  /**
   * 従来の統計計算（後方互換性のため）
   */
  static calculateVisitStatisticsLegacy(
    shrineTemples: ShrineTemple[],
    visitRecords: VisitRecord[]
  ): {
    totalShrines: number;
    visitedShrines: number;
    goshuinCollected: number;
    favoriteCount: number;
    visitRate: number;
  } {
    const visitedShrineIds = new Set(visitRecords.map(record => record.shrineTempleId));
    const goshuinShrineIds = new Set(
      visitRecords.filter(record => record.hasGoshuin).map(record => record.shrineTempleId)
    );
    const favoriteShrineIds = new Set(
      visitRecords.filter(record => record.isFavorite).map(record => record.shrineTempleId)
    );

    const totalShrines = shrineTemples.length;
    const visitedShrines = visitedShrineIds.size;
    const goshuinCollected = goshuinShrineIds.size;
    const favoriteCount = favoriteShrineIds.size;
    const visitRate = totalShrines > 0 ? Math.round((visitedShrines / totalShrines) * 100) : 0;

    return {
      totalShrines,
      visitedShrines,
      goshuinCollected,
      favoriteCount,
      visitRate,
    };
  }
}