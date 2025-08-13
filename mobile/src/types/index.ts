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