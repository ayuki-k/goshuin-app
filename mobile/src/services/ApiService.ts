import { ShrineTemple, SearchFilters } from '../types';

const API_BASE_URL = 'http://localhost:3001'; // API Server endpoint

class ApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  async searchShrineTemples(filters: SearchFilters): Promise<ShrineTemple[]> {
    const queryParams = new URLSearchParams();
    
    // URLSearchParams automatically handles UTF-8 encoding
    if (filters.prefecture) queryParams.append('prefecture', filters.prefecture);
    if (filters.city) queryParams.append('city', filters.city);
    if (filters.type && filters.type !== 'all') queryParams.append('type', filters.type);
    if (filters.hasGoshuin !== undefined) queryParams.append('hasGoshuin', filters.hasGoshuin.toString());

    return this.makeRequest<ShrineTemple[]>(`/shrines-temples?${queryParams.toString()}`);
  }

  async getShrineTempleById(id: string): Promise<ShrineTemple> {
    return this.makeRequest<ShrineTemple>(`/shrines-temples/${id}`);
  }

  async searchByLocation(lat: number, lng: number, radius: number = 10): Promise<ShrineTemple[]> {
    const queryParams = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      radius: radius.toString(),
    });

    return this.makeRequest<ShrineTemple[]>(`/search/nearby?${queryParams.toString()}`);
  }
}

export const apiService = new ApiService();