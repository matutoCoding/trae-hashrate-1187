import React from 'react';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { getRoomById } from '@/data/rooms';
import { getRateRules } from '@/utils/feeCalculator';
import Tag from '@/components/Tag';
import { useBookingStore } from '@/store/useBookingStore';
import classnames from 'classnames';
import styles from './index.module.scss';

const RoomDetailPage: React.FC = () => {
  const router = useRouter();
  const { setSelectedRoom } = useBookingStore();
  const roomId = router.params.id || '';
  const room = getRoomById(roomId);
  const rateRules = getRateRules();

  const handleBook = () => {
    if (!room || room.status !== 'available') {
      Taro.showToast({ title: '该排练室暂不可预约', icon: 'none' });
      return;
    }
    setSelectedRoom(room.id);
    Taro.switchTab({ url: '/pages/schedule/index' });
  };

  if (!room) {
    return (
      <View className={styles.page}>
        <View style={{ padding: 100, textAlign: 'center' }}>
          <Text>排练室不存在</Text>
        </View>
      </View>
    );
  }

  const statusText = {
    available: '可预约',
    maintenance: '维护中',
    closed: '已关闭'
  }[room.status] || '未知';

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Image
          className={styles.headerImage}
          src={room.imageUrl}
          mode="aspectFill"
        />
      </View>

      <View className={styles.roomInfo}>
        <Text className={styles.roomName}>{room.name}</Text>
        <Text className={styles.roomDesc}>{room.description}</Text>
        <View className={styles.infoRow}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>容纳</Text>
            <Text className={styles.infoValue}>{room.capacity}人</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>位置</Text>
            <Text className={styles.infoValue}>{room.location}</Text>
          </View>
          <View className={styles.infoItem}>
            <Tag text={statusText} type={room.status === 'available' ? 'success' : 'warning'} />
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>设备配置</Text>
        <View className={styles.equipmentList}>
          {room.equipments.map((eq, idx) => (
            <View key={idx} className={styles.equipmentTag}>
              <Text>{eq}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>时段费率</Text>
        <View className={styles.priceInfo}>
          <Text className={styles.priceSymbol}>¥</Text>
          <Text className={styles.priceValue}>{room.basePrice}</Text>
          <Text className={styles.priceUnit}>/时起</Text>
        </View>
        <View className={styles.rateList}>
          {rateRules.map((rule) => (
            <View key={rule.type} className={styles.rateItem}>
              <Text className={styles.rateName}>{rule.name}</Text>
              <Text className={classnames(styles.ratePrice, styles[rule.type])}>
                ¥{rule.price}
              </Text>
              <Text className={styles.rateTime}>
                {rule.startTime}-{rule.endTime}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: '24rpx', color: '#86909C' }}>起步价</Text>
          <View style={{ display: 'flex', alignItems: 'baseline' }}>
            <Text style={{ fontSize: '28rpx', color: '#FF6B6B', fontWeight: 500 }}>¥</Text>
            <Text style={{ fontSize: '40rpx', color: '#FF6B6B', fontWeight: 'bold' }}>
              {room.basePrice}
            </Text>
            <Text style={{ fontSize: '22rpx', color: '#86909C', marginLeft: '4rpx' }}>/时</Text>
          </View>
        </View>
        <Button
          className={classnames(styles.bookBtn, room.status !== 'available' && styles.disabled)}
          onClick={handleBook}
        >
          {room.status === 'available' ? '立即预约' : '暂不可预约'}
        </Button>
      </View>
    </ScrollView>
  );
};

export default RoomDetailPage;
