import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SearchFilters } from '../types';

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  loading?: boolean;
  lastSearchFilters?: SearchFilters | null;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  loading = false, 
  lastSearchFilters = null 
}) => {
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'shrine' | 'temple'>('all');

  // 最後の検索状態を復元
  useEffect(() => {
    if (lastSearchFilters) {
      console.log('SearchBar: Restoring last search filters:', lastSearchFilters);
      
      // 種別を復元
      setSelectedType(lastSearchFilters.type || 'all');
      
      // 検索テキストを復元（prefecture + city）
      if (!lastSearchFilters.isNearbySearch) {
        const parts = [];
        if (lastSearchFilters.prefecture) parts.push(lastSearchFilters.prefecture);
        if (lastSearchFilters.city) parts.push(lastSearchFilters.city);
        setSearchText(parts.join(' '));
      } else {
        setSearchText(''); // 近くの検索の場合は空にする
      }
    }
  }, [lastSearchFilters]);

  const handleSearch = () => {
    const filters: SearchFilters = {
      type: selectedType,
      hasGoshuin: true,
    };

    if (searchText.trim()) {
      // 地名が入力されている場合は通常の検索
      const searchTerms = searchText.trim().split(/[\s　]+/);
      if (searchTerms.length > 0) {
        filters.prefecture = searchTerms[0];
      }
      if (searchTerms.length > 1) {
        filters.city = searchTerms[1];
      }
    } else {
      // 地名が入力されていない場合は5km圏内検索
      filters.isNearbySearch = true;
    }

    onSearch(filters);
  };


  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="地名を入力（例：東京 渋谷）"
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
      </View>

      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>種別：</Text>
        <TouchableOpacity
          style={[styles.filterButton, selectedType === 'all' && styles.activeFilter]}
          onPress={() => setSelectedType('all')}
        >
          <Text style={[styles.filterText, selectedType === 'all' && styles.activeFilterText]}>
            すべて
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedType === 'shrine' && styles.activeFilter]}
          onPress={() => setSelectedType('shrine')}
        >
          <Text style={[styles.filterText, selectedType === 'shrine' && styles.activeFilterText]}>
            神社
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedType === 'temple' && styles.activeFilter]}
          onPress={() => setSelectedType('temple')}
        >
          <Text style={[styles.filterText, selectedType === 'temple' && styles.activeFilterText]}>
            寺院
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.searchButton, loading && styles.searchButtonDisabled]}
        onPress={handleSearch}
        disabled={loading}
      >
        <Text style={styles.searchButtonText}>
          {loading ? '検索中...' : searchText.trim() ? '🔍 検索' : '📍 5km圏内を表示'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 12,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f5f5f5',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
    color: '#666',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  activeFilter: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 12,
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#ccc',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});