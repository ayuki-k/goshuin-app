import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { ShrineTemple, VisitRecord, VisitStatus } from '../types';
import { VisitStatusUtils } from '../utils/VisitStatusUtils';

interface ShrineTempleCardProps {
  shrineTemple: ShrineTemple;
  onPress?: () => void;
  visitRecords?: VisitRecord[];
  onAddVisit?: (shrine: ShrineTemple) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const ShrineTempleCard: React.FC<ShrineTempleCardProps> = ({
  shrineTemple,
  onPress,
  visitRecords = [],
  onAddVisit,
}) => {
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // 参拝ステータスを取得
  const visitStatus: VisitStatus = VisitStatusUtils.getVisitStatus(shrineTemple, visitRecords);
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

  const renderGoshuinImage = () => {
    if (!shrineTemple.photoUrl || imageError) {
      return null;
    }

    return (
      <View style={styles.goshuinImageContainer}>
        <TouchableOpacity onPress={() => setImageModalVisible(true)}>
          <Image
            source={{ uri: shrineTemple.photoUrl }}
            style={styles.goshuinThumbnail}
            onError={() => setImageError(true)}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay}>
            <Text style={styles.imageOverlayText}>📿 御朱印を見る</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.icon}>{VisitStatusUtils.getMarkerIcon(shrineTemple, visitStatus)}</Text>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{shrineTemple.name}</Text>
            <Text style={styles.type}>{getTypeText(shrineTemple.type)}</Text>
            {visitStatus.isVisited && (
              <Text style={styles.visitStatus}>
                {visitStatus.hasGoshuin ? '🏅 御朱印取得済み' : '✅ 参拝済み'}
                {visitStatus.isFavorite && ' ❤️'}
                {visitStatus.visitCount > 1 && ` (${visitStatus.visitCount}回)`}
              </Text>
            )}
          </View>
        </View>
        
        {(shrineTemple.hasGoshuin || visitStatus.hasGoshuin) && (
          <View style={[
            styles.goshuinBadge,
            visitStatus.hasGoshuin && styles.goshuinBadgeObtained
          ]}>
            <Text style={styles.goshuinText}>
              {visitStatus.hasGoshuin ? '御朱印済' : '御朱印'}
            </Text>
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
        <View style={styles.footerLeft}>
          <Text style={styles.goshuinStatus}>
            {getGoshuinStatus(shrineTemple.hasGoshuin, shrineTemple.goshuinType)}
          </Text>
          {shrineTemple.officialUrl && (
            <Text style={styles.websiteIndicator}>🔗 公式サイトあり</Text>
          )}
        </View>
        
        {onAddVisit && (
          <TouchableOpacity
            style={styles.addVisitButton}
            onPress={(e) => {
              e.stopPropagation(); // カード全体のonPressを止める
              onAddVisit(shrineTemple);
            }}
          >
            <Text style={styles.addVisitButtonText}>
              {visitStatus.isVisited ? '+記録' : '参拝記録'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {renderGoshuinImage()}
    </TouchableOpacity>

    {/* 御朱印画像フルスクリーンモーダル */}
    <Modal
      visible={imageModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setImageModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <Pressable
          style={styles.modalBackground}
          onPress={() => setImageModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {getTypeIcon(shrineTemple.type)} {shrineTemple.name} の御朱印
              </Text>
              <Pressable
                style={styles.closeButton}
                onPress={() => setImageModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>
            
            {shrineTemple.photoUrl && !imageError && (
              <Image
                source={{ uri: shrineTemple.photoUrl }}
                style={styles.fullScreenImage}
                resizeMode="contain"
                onError={() => setImageError(true)}
              />
            )}
            
            <View style={styles.modalInfo}>
              <Text style={styles.modalInfoText}>
                {shrineTemple.address}
              </Text>
              {shrineTemple.hours_notes && (
                <Text style={styles.modalInfoText}>
                  ⏰ {shrineTemple.hours_notes}
                </Text>
              )}
            </View>
          </View>
        </Pressable>
      </View>
    </Modal>
  </>
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
  visitStatus: {
    fontSize: 11,
    color: '#007AFF',
    marginTop: 2,
    fontWeight: '500',
  },
  goshuinBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  goshuinBadgeObtained: {
    backgroundColor: '#FFD700',
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
  footerLeft: {
    flex: 1,
  },
  addVisitButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  addVisitButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  goshuinImageContainer: {
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  goshuinThumbnail: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    alignItems: 'center',
  },
  imageOverlayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    maxWidth: screenWidth * 0.9,
    maxHeight: screenHeight * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  fullScreenImage: {
    width: screenWidth * 0.8,
    height: screenWidth * 0.6,
    borderRadius: 8,
  },
  modalInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
});