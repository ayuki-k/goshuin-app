import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

interface MapLegendProps {
  visible: boolean;
  onToggle: () => void;
}

export const MapLegend: React.FC<MapLegendProps> = ({
  visible,
  onToggle,
}) => {
  const LegendItem: React.FC<{ icon: string; color: string; label: string }> = ({ icon, color, label }) => (
    <View style={styles.legendItem}>
      <View style={[styles.legendIcon, { backgroundColor: color }]}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.toggleButton} onPress={onToggle}>
        <Text style={styles.toggleButtonText}>
          {visible ? '📍 凡例を隠す' : '📍 凡例を表示'}
        </Text>
      </TouchableOpacity>

      {visible && (
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>マーカーの説明</Text>
          
          <LegendItem
            icon="⛩️"
            color="#ffebee"
            label="神社（未参拝）"
          />
          
          <LegendItem
            icon="🏯"
            color="#e0f2f1"
            label="寺院（未参拝）"
          />
          
          <View style={styles.legendItem}>
            <View style={[styles.legendIcon, { backgroundColor: '#e8f5e8' }]}>
              <Text style={styles.iconText}>⛩️</Text>
              <View style={styles.miniLegendBadge}>
                <Text style={styles.miniBadgeText}>✅</Text>
              </View>
            </View>
            <Text style={styles.legendLabel}>参拝済み</Text>
          </View>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendIcon, { backgroundColor: '#fff8e1' }]}>
              <Text style={styles.iconText}>⛩️</Text>
              <View style={styles.miniLegendBadge}>
                <Text style={styles.miniBadgeText}>🏅</Text>
              </View>
            </View>
            <Text style={styles.legendLabel}>御朱印取得済み</Text>
          </View>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendIcon, { backgroundColor: '#fce4ec' }]}>
              <Text style={styles.iconText}>⛩️</Text>
              <View style={styles.heartOverlay}>
                <Text style={styles.heartOverlayText}>❤️</Text>
              </View>
            </View>
            <Text style={styles.legendLabel}>お気に入り（未参拝）</Text>
          </View>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendIcon, { backgroundColor: '#e8f5e8' }]}>
              <Text style={styles.iconText}>⛩️</Text>
              <View style={styles.heartOverlay}>
                <Text style={styles.heartOverlayText}>❤️</Text>
              </View>
              <View style={styles.miniLegendBadge}>
                <Text style={styles.miniBadgeText}>✅</Text>
              </View>
            </View>
            <Text style={styles.legendLabel}>お気に入り + 参拝済み</Text>
          </View>
          
          <View style={styles.noteContainer}>
            <Text style={styles.noteText}>
              💡 マーカーに数字がある場合は複数回参拝
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1000,
  },
  toggleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleButtonText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  legendContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: 200,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  iconText: {
    fontSize: 10,
  },
  legendLabel: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  noteContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  noteText: {
    fontSize: 10,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  miniLegendBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#fff',
    borderRadius: 6,
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#ddd',
  },
  miniBadgeText: {
    fontSize: 6,
  },
  heartOverlay: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    zIndex: 1,
  },
  heartOverlayText: {
    fontSize: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1,
  },
});