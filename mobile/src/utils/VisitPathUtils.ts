import { VisitRecord, ShrineTemple } from '../types';

export interface VisitPathPoint {
  visitRecord: VisitRecord;
  shrineTemple?: ShrineTemple;
  latitude: number;
  longitude: number;
  order: number;
  visitDate: string;
}

export interface VisitPath {
  id: string;
  points: VisitPathPoint[];
  color: string;
  totalDistance: number;
  timeSpan: string;
}

/**
 * 参拝記録から経路情報を生成するユーティリティクラス
 */
export class VisitPathUtils {
  /**
   * 参拝記録と神社・寺院データから参拝経路を生成
   */
  static generateVisitPaths(
    visitRecords: VisitRecord[],
    shrineTemples: ShrineTemple[]
  ): VisitPath[] {
    // 神社・寺院データをマップ化
    const shrineTempleMap = new Map<string, ShrineTemple>();
    shrineTemples.forEach(st => {
      shrineTempleMap.set(st.id, st);
    });

    // 座標を持つ参拝記録のみをフィルタリング
    const validVisits = visitRecords
      .map(visit => {
        const shrineTemple = shrineTempleMap.get(visit.shrineTempleId);
        if (!shrineTemple?.lat || !shrineTemple?.lng) {
          return null;
        }
        return {
          visitRecord: visit,
          shrineTemple,
          latitude: Number(shrineTemple.lat),
          longitude: Number(shrineTemple.lng),
          visitDate: visit.visitDate,
        };
      })
      .filter((visit): visit is NonNullable<typeof visit> => visit !== null);

    if (validVisits.length < 2) {
      return []; // 線を引くには最低2点必要
    }

    // 日付順にソート
    validVisits.sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime());

    // order番号を付与
    const pathPoints: VisitPathPoint[] = validVisits.map((visit, index) => ({
      ...visit,
      order: index + 1,
    }));

    // 経路の統計情報を計算
    const totalDistance = this.calculateTotalDistance(pathPoints);
    const timeSpan = this.calculateTimeSpan(pathPoints);
    const pathColor = this.generatePathColor(pathPoints.length);

    return [{
      id: 'main_path',
      points: pathPoints,
      color: pathColor,
      totalDistance,
      timeSpan,
    }];
  }

  /**
   * 月別や年別で経路を分割
   */
  static generateVisitPathsByPeriod(
    visitRecords: VisitRecord[],
    shrineTemples: ShrineTemple[],
    groupBy: 'month' | 'year' = 'month'
  ): VisitPath[] {
    const shrineTempleMap = new Map<string, ShrineTemple>();
    shrineTemples.forEach(st => {
      shrineTempleMap.set(st.id, st);
    });

    const validVisits = visitRecords
      .map(visit => {
        const shrineTemple = shrineTempleMap.get(visit.shrineTempleId);
        if (!shrineTemple?.lat || !shrineTemple?.lng) {
          return null;
        }
        return {
          visitRecord: visit,
          shrineTemple,
          latitude: Number(shrineTemple.lat),
          longitude: Number(shrineTemple.lng),
          visitDate: visit.visitDate,
        };
      })
      .filter((visit): visit is NonNullable<typeof visit> => visit !== null);

    // 期間別にグループ化
    const groups = this.groupVisitsByPeriod(validVisits, groupBy);
    
    return Object.entries(groups).map(([period, visits], index) => {
      if (visits.length < 2) return null;

      // 日付順にソート
      visits.sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime());

      const pathPoints: VisitPathPoint[] = visits.map((visit, idx) => ({
        ...visit,
        order: idx + 1,
      }));

      const totalDistance = this.calculateTotalDistance(pathPoints);
      const timeSpan = this.calculateTimeSpan(pathPoints);
      const pathColor = this.generatePathColorByIndex(index);

      return {
        id: `path_${period}`,
        points: pathPoints,
        color: pathColor,
        totalDistance,
        timeSpan,
      };
    }).filter((path): path is VisitPath => path !== null);
  }

  /**
   * 2点間の距離を計算（Haversine formula）
   */
  private static calculateDistance(
    lat1: number, lng1: number,
    lat2: number, lng2: number
  ): number {
    const R = 6371; // 地球の半径（km）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * 経路の総距離を計算
   */
  private static calculateTotalDistance(points: VisitPathPoint[]): number {
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      total += this.calculateDistance(
        prev.latitude, prev.longitude,
        curr.latitude, curr.longitude
      );
    }
    return Math.round(total * 10) / 10; // 小数点1桁で四捨五入
  }

  /**
   * 期間の計算
   */
  private static calculateTimeSpan(points: VisitPathPoint[]): string {
    if (points.length < 2) return '';
    
    const start = new Date(points[0].visitDate);
    const end = new Date(points[points.length - 1].visitDate);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return '同日';
    } else if (diffDays < 30) {
      return `${diffDays}日間`;
    } else if (diffDays < 365) {
      const months = Math.ceil(diffDays / 30);
      return `${months}ヶ月間`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingDays = diffDays % 365;
      return years > 0 ? `${years}年${Math.ceil(remainingDays / 30)}ヶ月間` : `${Math.ceil(diffDays / 30)}ヶ月間`;
    }
  }

  /**
   * 期間別グループ化
   */
  private static groupVisitsByPeriod(
    visits: Array<{visitDate: string; visitRecord: VisitRecord; shrineTemple: ShrineTemple; latitude: number; longitude: number}>,
    groupBy: 'month' | 'year'
  ): Record<string, typeof visits> {
    return visits.reduce((groups, visit) => {
      const date = new Date(visit.visitDate);
      const key = groupBy === 'month' 
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        : `${date.getFullYear()}`;
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(visit);
      return groups;
    }, {} as Record<string, typeof visits>);
  }

  /**
   * 経路の色を生成
   */
  private static generatePathColor(pointCount: number): string {
    // 参拝地点数に応じて色の濃さを変更
    const intensity = Math.min(pointCount / 10, 1); // 最大10地点で最濃色
    const blue = Math.floor(255 * intensity);
    return `rgba(0, 122, ${blue}, 0.8)`;
  }

  /**
   * インデックスベースの経路色生成
   */
  private static generatePathColorByIndex(index: number): string {
    const colors = [
      'rgba(0, 122, 255, 0.8)',   // 青
      'rgba(255, 59, 48, 0.8)',   // 赤
      'rgba(52, 199, 89, 0.8)',   // 緑
      'rgba(255, 149, 0, 0.8)',   // オレンジ
      'rgba(175, 82, 222, 0.8)',  // 紫
      'rgba(255, 204, 0, 0.8)',   // 黄色
      'rgba(90, 200, 250, 0.8)',  // 水色
      'rgba(255, 105, 180, 0.8)', // ピンク
    ];
    return colors[index % colors.length];
  }

  /**
   * 経路ポイントの説明文を生成
   */
  static generatePathDescription(path: VisitPath): string {
    const pointCount = path.points.length;
    const startDate = new Date(path.points[0].visitDate).toLocaleDateString('ja-JP');
    const endDate = new Date(path.points[path.points.length - 1].visitDate).toLocaleDateString('ja-JP');
    
    return `${pointCount}ヶ所参拝 (${startDate} - ${endDate})\n総距離: ${path.totalDistance}km • 期間: ${path.timeSpan}`;
  }
}