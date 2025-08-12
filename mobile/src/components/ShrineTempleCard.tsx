import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { ShrineTemple } from '../types';

interface ShrineTempleCardProps {
  shrineTemple: ShrineTemple;
  onPress?: () => void;
}

export const ShrineTempleCard: React.FC<ShrineTempleCardProps> = ({
  shrineTemple,
  onPress,
}) => {
  const getTypeIcon = (type: string) => {
    return type === 'shrine' ? '⛩️' : '🏯';
  };

  const getTypeText = (type: string) => {
    return type === 'shrine' ? '神社' : '寺院';
  };

  const getGoshuinStatus = (hasGoshuin: boolean, goshuinType?: string) => {
    if (!hasGoshuin) return '御朱印なし';
    if (goshuinType && goshuinType !== 'unknown') return `御朱印: ${goshuinType}`;
    return '御朱印あり';
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.icon}>{getTypeIcon(shrineTemple.type)}</Text>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{shrineTemple.name}</Text>
            <Text style={styles.type}>{getTypeText(shrineTemple.type)}</Text>
          </View>
        </View>
        
        {shrineTemple.hasGoshuin && (
          <View style={styles.goshuinBadge}>
            <Text style={styles.goshuinText}>御朱印</Text>
          </View>
        )}
      </View>

      <View style={styles.locationContainer}>
        <Text style={styles.location}>
          📍 {shrineTemple.prefecture} {shrineTemple.city}
        </Text>
        {shrineTemple.address && (
          <Text style={styles.address}>{shrineTemple.address}</Text>
        )}
      </View>

      {shrineTemple.hours_notes && (
        <Text style={styles.hours}>
          ⏰ {shrineTemple.hours_notes}
        </Text>
      )}

      {shrineTemple.specialPeriod && (
        <View style={styles.specialContainer}>
          <Text style={styles.specialPeriod}>
            ✨ {shrineTemple.specialPeriod}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.goshuinStatus}>
          {getGoshuinStatus(shrineTemple.hasGoshuin, shrineTemple.goshuinType)}
        </Text>
        
        {shrineTemple.officialUrl && (
          <Text style={styles.websiteIndicator}>🔗 公式サイトあり</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
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
  goshuinBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  goshuinText: {
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
  hours: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  specialContainer: {
    backgroundColor: '#FFF3CD',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  specialPeriod: {
    fontSize: 12,
    color: '#856404',
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
  goshuinStatus: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  websiteIndicator: {
    fontSize: 10,
    color: '#666',
  },
});