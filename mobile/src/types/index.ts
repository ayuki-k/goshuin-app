export interface ShrineTemple {
  id: string;
  prefecture: string;
  city: string;
  name: string;
  type: 'shrine' | 'temple';
  hasGoshuin: boolean;
  goshuinType?: string;
  address?: string;
  lat?: number;
  lng?: number;
  hours_notes?: string;
  specialPeriod?: string;
  officialUrl?: string;
  photoUrl?: string;
  source: string;
  updatedAt: string;
}

export interface SearchFilters {
  prefecture?: string;
  city?: string;
  type?: 'shrine' | 'temple' | 'all';
  hasGoshuin?: boolean;
  isNearbySearch?: boolean; // 現在地付近検索フラグ
}

export interface VisitRecord {
  id: string; // 一意識別子
  shrineTempleId: string; // 参拝した神社・寺院のID
  shrineTempleName: string; // 神社・寺院名（表示用）
  visitDate: string; // 参拝日（YYYY-MM-DD形式）
  notes?: string; // メモ・感想
  hasGoshuin: boolean; // 御朱印をもらったか
  goshuinImageUrl?: string; // 御朱印画像URL
  rating?: number; // 評価（1-5）
  isFavorite?: boolean; // お気に入り登録
  createdAt: string; // 登録日時（ISO string）
  updatedAt: string; // 更新日時（ISO string）
}

// 参拝ステータス情報
export interface VisitStatus {
  isVisited: boolean; // 参拝済みかどうか
  hasGoshuin: boolean; // 御朱印取得済みかどうか
  isFavorite: boolean; // お気に入り登録済みかどうか
  visitCount: number; // 参拝回数
  lastVisitDate?: string; // 最後の参拝日
  visitRecord?: VisitRecord; // 最新の参拝記録
}