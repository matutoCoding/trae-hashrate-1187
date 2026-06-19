import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useUserStore } from '@/store/useUserStore';
import { useBookingStore } from '@/store/useBookingStore';
import { WaitlistStatus } from '@/types';
import { formatDate, getDayOfWeek } from '@/utils/timeUtils';
import Tag from '@/components/Tag';
import classnames from 'classnames';
import styles from './index.module.scss';

type TabType = 'waiting' | 'history';

const statusTextMap: Record<WaitlistStatus, string> = {
  waiting: '等待中',
  notified: '已通知待确认',
  confirmed: '已确认补位',
  cancelled: '已取消',
  expired: '已过期'
};

const WaitlistPage: React.FC = () => {
  const { userInfo } = useUserStore();
  const { getWaitlistByUser, cancelWaitlist } = useBookingStore();
  const [activeTab, setActiveTab] = useState<TabType>('waiting');

  const myWaitlist = useMemo(() => {
    if (!userInfo) return [];
    return getWaitlistByUser(userInfo.id);
  }, [userInfo, getWaitlistByUser]);

  const waitingList = useMemo(() => {
    return myWaitlist.filter(w => w.status === 'waiting' || w.status === 'notified');
  }, [myWaitlist]);

  const historyList = useMemo(() => {
    return myWaitlist.filter(w => w.status === 'confirmed' || w.status === 'cancelled' || w.status === 'expired');
  }, [myWaitlist]);

  const displayList = activeTab === 'waiting' ? waitingList : historyList;

  const handleCancel = (id: string) => {
    Taro.showModal({
      title: '取消候补',
      content: '确定要取消该候补吗？',
      success: (res) => {
        if (res.confirm) {
          cancelWaitlist(id);
          Taro.showToast({ title: '已取消候补', icon: 'success' });
          console.log('[WaitlistPage] 取消候补:', id);
        }
      }
    });
  };

  const handleConfirm = (id: string) => {
    Taro.showToast({ title: '补位确认成功', icon: 'success' });
    console.log('[WaitlistPage] 确认补位:', id);
  };

  const goToSchedule = () => {
    Taro.switchTab({ url: '/pages/schedule/index' });
  };

  const renderCard = (item: any) => (
    <View key={item.id} className={styles.card}>
      <View className={styles.cardHeader}>
        <Text className={styles.roomName}>{item.roomName}</Text>
        <View className={styles.positionBadge}>#{item.position}</View>
      </View>
      <View className={styles.cardBody}>
        <View className={styles.timeRow}>
          <Text className={styles.timeLabel}>日期</Text>
          <Text className={styles.timeValue}>
            {formatDate(item.date)} {getDayOfWeek(item.date)}
          </Text>
        </View>
        <View className={styles.timeRow}>
          <Text className={styles.timeLabel}>时段</Text>
          <Text className={styles.timeValue}>{item.startTime} - {item.endTime}</Text>
        </View>
      </View>
      <View className={styles.cardFooter}>
        <Text className={classnames(styles.statusText, styles[item.status])}>
          {statusTextMap[item.status]}
        </Text>
        <View style={{ display: 'flex', gap: '16rpx' }}>
          {(item.status === 'waiting') && (
            <Button
              className={`${styles.actionBtn} ${styles.secondary}`}
              onClick={() => handleCancel(item.id)}
            >
              取消候补
            </Button>
          )}
          {item.status === 'notified' && (
            <>
              <Button
                className={`${styles.actionBtn} ${styles.secondary}`}
                onClick={() => handleCancel(item.id)}
              >
                放弃
              </Button>
              <Button
                className={`${styles.actionBtn} ${styles.primary}`}
                onClick={() => handleConfirm(item.id)}
              >
                确认补位
              </Button>
            </>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView
      className={styles.page}
      scrollY
      refresherEnabled
    >
      <View className={styles.tabs}>
        <View
          className={classnames(styles.tab, activeTab === 'waiting' && styles.active)}
          onClick={() => setActiveTab('waiting')}
        >
          等待中 ({waitingList.length})
        </View>
        <View
          className={classnames(styles.tab, activeTab === 'history' && styles.active)}
          onClick={() => setActiveTab('history')}
        >
          历史记录
        </View>
      </View>

      {activeTab === 'waiting' && (
        <View className={styles.notice}>
          <Text className={styles.noticeTitle}>候补规则</Text>
          <Text className={styles.noticeContent}>
            当有人取消预约或超时未到，系统会按候补顺序自动通知补位。请保持消息畅通，收到通知后15分钟内确认，否则名额顺延。
          </Text>
        </View>
      )}

      <View className={styles.list}>
        {displayList.length > 0 ? (
          displayList.map(item => renderCard(item))
        ) : (
          <View className={styles.empty}>
            <Text className={styles.emptyIcon}>⏰</Text>
            <Text className={styles.emptyText}>
              {activeTab === 'waiting' ? '暂无待候补记录' : '暂无历史记录'}
            </Text>
            <Button className={styles.emptyBtn} onClick={goToSchedule}>
              去看看排期
            </Button>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default WaitlistPage;
