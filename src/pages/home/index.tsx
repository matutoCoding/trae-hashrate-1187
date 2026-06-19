import React, { useState, useEffect } from 'react';
import { View, Text, Image, Input, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useUserStore } from '@/store/useUserStore';
import { mockRooms, getAvailableRooms } from '@/data/rooms';
import { getRateRules } from '@/utils/feeCalculator';
import RoomCard from '@/components/RoomCard';
import Tag from '@/components/Tag';
import { Room } from '@/types';
import styles from './index.module.scss';

const HomePage: React.FC = () => {
  const { userInfo } = useUserStore();
  const [searchText, setSearchText] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const rateRules = getRateRules();

  useEffect(() => {
    console.log('[HomePage] 页面加载，获取排练室列表');
    const availableRooms = mockRooms;
    setRooms(availableRooms);
    setFilteredRooms(availableRooms);
  }, []);

  useEffect(() => {
    if (searchText.trim()) {
      const filtered = rooms.filter(
        room =>
          room.name.includes(searchText) ||
          room.description.includes(searchText) ||
          room.equipments.some(eq => eq.includes(searchText))
      );
      setFilteredRooms(filtered);
    } else {
      setFilteredRooms(rooms);
    }
  }, [searchText, rooms]);

  const handleRefresh = () => {
    console.log('[HomePage] 下拉刷新');
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 1000);
  };

  const goToSchedule = () => {
    Taro.switchTab({ url: '/pages/schedule/index' });
  };

  const goToWaitlist = () => {
    Taro.switchTab({ url: '/pages/waitlist/index' });
  };

  return (
    <ScrollView
      className={styles.page}
      scrollY
      refresherEnabled
      onRefresherRefresh={handleRefresh}
    >
      <View className={styles.header}>
        <View className={styles.greeting}>
          <View className={styles.greetingText}>
            <Text className={styles.hello}>你好，{userInfo?.name || '音乐人'}</Text>
            <Text className={styles.sub}>今天也要好好排练哦 🎸</Text>
          </View>
          <Image
            className={styles.avatar}
            src={userInfo?.avatar || 'https://picsum.photos/id/64/200/200'}
            mode="aspectFill"
          />
        </View>
        <View className={styles.searchBox}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="搜索排练室、设备..."
            value={searchText}
            onInput={(e) => setSearchText(e.detail.value)}
          />
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.quickActions}>
          <View className={styles.quickCard} onClick={goToSchedule}>
            <View className={`${styles.quickIcon} ${styles.primary}`}>
              <Text>📅</Text>
            </View>
            <Text className={styles.quickText}>预约排期</Text>
            <Text className={styles.quickDesc}>查看可用时段</Text>
          </View>
          <View className={styles.quickCard} onClick={goToWaitlist}>
            <View className={`${styles.quickIcon} ${styles.warning}`}>
              <Text>⏰</Text>
            </View>
            <Text className={styles.quickText}>候补补位</Text>
            <Text className={styles.quickDesc}>满员自动通知</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.rateCard}>
          <Text className={styles.rateTitle}>时段费率</Text>
          <View className={styles.rateList}>
            {rateRules.map((rule) => (
              <View key={rule.type} className={styles.rateItem}>
                <Tag text={rule.name} type={rule.type as 'peak' | 'offpeak' | 'night'} size="sm" />
                <Text className={`${styles.ratePrice} ${styles[rule.type]}`}>
                  ¥{rule.price}
                </Text>
                <Text className={styles.rateTime}>{rule.startTime}-{rule.endTime}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>全部排练室</Text>
          <Text className={styles.sectionMore}>共 {filteredRooms.length} 间</Text>
        </View>
        <View className={styles.roomList}>
          {filteredRooms.length > 0 ? (
            filteredRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))
          ) : (
            <View className={styles.empty}>
              <Text style={{ fontSize: '80rpx' }}>🎵</Text>
              <Text className={styles.emptyText}>暂无匹配的排练室</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default HomePage;
