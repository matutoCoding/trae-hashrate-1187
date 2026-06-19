import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { Room } from '@/types';
import Tag from '@/components/Tag';
import styles from './index.module.scss';

export interface RoomCardProps {
  room: Room;
  onClick?: () => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/room-detail/index?id=${room.id}`
      });
    }
  };

  const getStatusTag = () => {
    switch (room.status) {
      case 'available':
        return <Tag text="可预约" type="success" />;
      case 'maintenance':
        return <Tag text="维护中" type="warning" />;
      case 'closed':
        return <Tag text="已关闭" type="error" />;
      default:
        return null;
    }
  };

  return (
    <View
      className={classnames(styles.card, room.status !== 'available' && styles.disabled)}
      onClick={handleClick}
    >
      <Image
        className={styles.image}
        src={room.imageUrl}
        mode="aspectFill"
        onError={(e) => console.error('[RoomCard] 图片加载失败:', e)}
      />
      <View className={styles.content}>
        <View className={styles.header}>
          <Text className={styles.name}>{room.name}</Text>
          {getStatusTag()}
        </View>
        <Text className={styles.description}>{room.description}</Text>
        <View className={styles.info}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>容纳</Text>
            <Text className={styles.infoValue}>{room.capacity}人</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>位置</Text>
            <Text className={styles.infoValue}>{room.location}</Text>
          </View>
        </View>
        <View className={styles.footer}>
          <View className={styles.equipments}>
            {room.equipments.slice(0, 3).map((eq, idx) => (
              <Text key={idx} className={styles.equipmentTag}>{eq}</Text>
            ))}
            {room.equipments.length > 3 && (
              <Text className={styles.equipmentMore}>+{room.equipments.length - 3}</Text>
            )}
          </View>
          <View className={styles.price}>
            <Text className={styles.priceSymbol}>¥</Text>
            <Text className={styles.priceValue}>{room.basePrice}</Text>
            <Text className={styles.priceUnit}>/时起</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default RoomCard;
