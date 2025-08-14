import { VisitRecord, ShrineTemple, VisitStatus } from '../types';

/**
 * 参拝ステータス管理のユーティリティクラス
 */
export class VisitStatusUtils {
  /**
   * 神社・寺院の参拝ステータスを計算
   */
  static getVisitStatus(
    shrineTemple: ShrineTemple,
    visitRecords: VisitRecord[]
  ): VisitStatus {
    // この神社・寺院の参拝記録をすべて取得
    const shrineVisitRecords = visitRecords.filter(
      record => record.shrineTempleId === shrineTemple.id
    );

    if (shrineVisitRecords.length === 0) {
      // 未参拝
      return {
        isVisited: false,
        hasGoshuin: false,
        isFavorite: false,
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

    // お気に入りの有無（最新記録のお気に入り状態）
    const isFavorite = latestRecord.isFavorite || false;

    return {
      isVisited: true,
      hasGoshuin,
      isFavorite,
      visitCount: shrineVisitRecords.length,
      lastVisitDate: latestRecord.visitDate,
      visitRecord: latestRecord,
    };
  }

  /**
   * 参拝ステータスに応じたマーカーの色を取得
   */
  static getMarkerColor(
    shrineTemple: ShrineTemple,
    visitStatus: VisitStatus
  ): string {
    if (!visitStatus.isVisited) {
      // 未参拝: デフォルトの色（神社は赤、寺院は青緑）
      return shrineTemple.type === 'shrine' ? '#FF6B6B' : '#4ECDC4';
    }

    if (visitStatus.hasGoshuin) {
      // 御朱印取得済み: 金色
      return '#FFD700';
    }

    if (visitStatus.isFavorite) {
      // お気に入り登録済み: ピンク
      return '#FF69B4';
    }

    // 参拝済み（御朱印なし、お気に入りなし）: 濃いグレー
    return '#666666';
  }

  /**
   * 参拝ステータスに応じたマーカーのアイコンを取得
   */
  static getMarkerIcon(
    shrineTemple: ShrineTemple,
    visitStatus: VisitStatus
  ): string {
    const baseIcon = shrineTemple.type === 'shrine' ? '⛩️' : '🏯';
    
    if (!visitStatus.isVisited) {
      return baseIcon;
    }

    if (visitStatus.hasGoshuin) {
      // 御朱印取得済み
      return '🏅'; // または ✨
    }

    if (visitStatus.isFavorite) {
      // お気に入り
      return '❤️';
    }

    // 参拝済み
    return '✅';
  }

  /**
   * 参拝ステータスの説明文を生成
   */
  static getStatusDescription(
    shrineTemple: ShrineTemple,
    visitStatus: VisitStatus
  ): string {
    const baseInfo = `${shrineTemple.name}\n${shrineTemple.prefecture} ${shrineTemple.city}`;
    
    if (!visitStatus.isVisited) {
      return `${baseInfo}\n未参拝`;
    }

    const statusParts: string[] = [];
    
    if (visitStatus.visitCount > 1) {
      statusParts.push(`${visitStatus.visitCount}回参拝`);
    } else {
      statusParts.push('参拝済み');
    }

    if (visitStatus.hasGoshuin) {
      statusParts.push('御朱印あり');
    }

    if (visitStatus.isFavorite) {
      statusParts.push('お気に入り');
    }

    if (visitStatus.lastVisitDate) {
      const lastVisit = new Date(visitStatus.lastVisitDate).toLocaleDateString('ja-JP');
      statusParts.push(`最終参拝: ${lastVisit}`);
    }

    return `${baseInfo}\n${statusParts.join(' • ')}`;
  }

  /**
   * 参拝統計を計算
   */
  static calculateVisitStatistics(
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