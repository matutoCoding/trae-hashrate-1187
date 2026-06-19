import React from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useUserStore } from '@/store/useUserStore';
import { useBookingStore } from '@/store/useBookingStore';
import styles from './index.module.scss';

const MinePage: React.FC = () => {
  const { userInfo } = useUserStore();
  const { bookings, waitlist, bills, startTimeoutChecker, processTimeout } = useBookingStore();

  React.useEffect(() => {
    startTimeoutChecker();
    processTimeout();
  }, [startTimeoutChecker, processTimeout]);

  const myBookings = userInfo ? bookings.filter(b => b.userId === userInfo.id) : [];
  const myWaitlist = userInfo ? waitlist.filter(w => w.userId === userInfo.id) : [];
  const myBills = userInfo ? bills.filter(b => b.userId === userInfo.id) : [];

  const pendingBookings = myBookings.filter(b => b.status === 'confirmed').length;
  const completedBookings = myBookings.filter(b => b.status === 'completed').length;
  const waitingWaitlist = myWaitlist.filter(w => w.status === 'waiting' || w.status === 'notified').length;
  const pendingBills = myBills.filter(b => b.status === 'pending').length;

  const goToBookingDetail = (bookingId: string) => {
    Taro.navigateTo({
      url: `/pages/bill-detail/index?bookingId=${bookingId}`
    });
  };

  const handleMenuItemClick = (type: string) => {
    console.log('[MinePage] 点击菜单项:', type);
    Taro.showToast({ title: '功能开发中', icon: 'none' });
  };

  return (
    <ScrollView
      className={styles.page}
      scrollY
      refresherEnabled
    >
      <View className={styles.header}>
        <View className={styles.userInfo}>
          <Image
            className={styles.avatar}
            src={userInfo?.avatar || 'https://picsum.photos/id/64/200/200'}
            mode="aspectFill"
          />
          <View className={styles.userText}>
            <Text className={styles.userName}>{userInfo?.name || '未登录'}</Text>
            <Text className={styles.userPhone}>{userInfo?.phone || '点击登录'}</Text>
          </View>
        </View>
        <View className={styles.stats}>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{pendingBookings}</Text>
            <Text className={styles.statLabel}>待使用</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{waitingWaitlist}</Text>
            <Text className={styles.statLabel}>候补中</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{completedBookings}</Text>
            <Text className={styles.statLabel}>已完成</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{pendingBills}</Text>
            <Text className={styles.statLabel}>待支付</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>常用功能</Text>
        <View className={styles.quickActions}>
          <View className={styles.quickItem} onClick={() => handleMenuItemClick('booking')}>
            <View className={styles.quickIcon}>📅</View>
            <Text className={styles.quickLabel}>我的预约</Text>
          </View>
          <View className={styles.quickItem} onClick={() => handleMenuItemClick('bill')}>
            <View className={styles.quickIcon}>💰</View>
            <Text className={styles.quickLabel}>我的账单</Text>
          </View>
          <View className={styles.quickItem} onClick={() => handleMenuItemClick('waitlist')}>
            <View className={styles.quickIcon}>⏰</View>
            <Text className={styles.quickLabel}>候补记录</Text>
          </View>
          <View className={styles.quickItem} onClick={() => handleMenuItemClick('equipment')}>
            <View className={styles.quickIcon}>🎸</View>
            <Text className={styles.quickLabel}>租借记录</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>账单服务</Text>
        <View className={styles.menuCard}>
          <View className={styles.menuItem} onClick={() => handleMenuItemClick('recharge')}>
            <View className={styles.menuIcon}>💳</View>
            <Text className={styles.menuText}>账户余额</Text>
            <Text style={{ color: '#FF6B6B', fontWeight: '600', marginRight: '16rpx' }}>
              ¥{userInfo?.balance || 0}
            </Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem} onClick={() => handleMenuItemClick('coupon')}>
            <View className={`${styles.menuIcon} ${styles.success}`}>🎫</View>
            <Text className={styles.menuText}>优惠券</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem} onClick={() => handleMenuItemClick('invoice')}>
            <View className={`${styles.menuIcon} ${styles.info}`}>📄</View>
            <Text className={styles.menuText}>发票管理</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>其他</Text>
        <View className={styles.menuCard}>
          <View className={styles.menuItem} onClick={() => handleMenuItemClick('rate')}>
            <View className={styles.menuIcon}>⭐</View>
            <Text className={styles.menuText}>评分反馈</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem} onClick={() => handleMenuItemClick('help')}>
            <View className={`${styles.menuIcon} ${styles.warning}`}>❓</View>
            <Text className={styles.menuText}>帮助中心</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem} onClick={() => handleMenuItemClick('settings')}>
            <View className={styles.menuIcon}>⚙️</View>
            <Text className={styles.menuText}>设置</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.logout}>退出登录</View>
      </View>
    </ScrollView>
  );
};

export default MinePage;
