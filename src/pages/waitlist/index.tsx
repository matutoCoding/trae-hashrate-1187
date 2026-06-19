import React, { useState, useMemo, useEffect } from 'react';
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
  const { waitlist, cancelWaitlist, confirmWaitlist, declineWaitlist, startTimeoutChecker, stopTimeoutChecker, processTimeout } = useBookingStore();
  const [activeTab, setActiveTab] = useState<TabType>('waiting');

  useEffect(() => {
    startTimeoutChecker();
    processTimeout();
    return () => {
      stopTimeoutChecker();
    };
  }, [startTimeoutChecker, stopTimeoutChecker, processTimeout]);

  const myWaitlist = useMemo(() => {
    if (!userInfo) return [];
    return waitlist.filter(w => w.userId === userInfo.id);
  }, [userInfo, waitlist]);

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
    Taro.showModal({
      title: '确认补位',
      content: '确认补位后将生成预约订单，请在15分钟内完成支付。是否确认？',
      success: (res) => {
        if (res.confirm) {
          const result = confirmWaitlist(id);
          if (result) {
            Taro.showToast({ title: '补位确认成功', icon: 'success' });
            console.log('[WaitlistPage] 确认补位:', id, '生成预约:', result.booking.id);

            setTimeout(() => {
              Taro.redirectTo({
                url: `/pages/bill-detail/index?bookingId=${result.booking.id}`
              });
            }, 1500);
          } else {
            Taro.showToast({ title: '操作失败，请重试', icon: 'none' });
          }
        }
      }
    });
  };

  const handleDecline = (id: string) => {
    Taro.showModal({
      title: '放弃补位',
      content: '放弃后名额将顺延给下一位候补用户。确定放弃吗？',
      success: (res) => {
        if (res.confirm) {
          declineWaitlist(id);
          Taro.showToast({ title: '已放弃补位', icon: 'success' });
          console.log('[WaitlistPage] 放弃补位:', id);
        }
      }
    });
  };

  const goToSchedule = () => {
    Taro.switchTab({ url: '/pages/schedule/index' });
  };

  const goToRegister = () => {
    Taro.navigateTo({ url: '/pages/waitlist-register/index' });
  };

  const renderCard = (item: any) => (
    <View key={item.id} className={styles.card}>
      <View className={styles.cardHeader}>
        <Text className={styles.roomName}>{item.roomName}</Text>
        <View className={classnames(styles.positionBadge, styles[item.status])}>
          {item.status === 'waiting' ? `#${item.position}` : statusTextMap[item.status]}
        </View>
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
        {item.status === 'notified' && (
          <View className={styles.notifyTip}>
            <Text className={styles.notifyTipText}>
              📢 请在15分钟内确认，超时名额将顺延
            </Text>
          </View>
        )}
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
                onClick={() => handleDecline(item.id)}
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
          {item.status === 'confirmed' && (
            <Button
              className={`${styles.actionBtn} ${styles.primary}`}
              onClick={() => Taro.switchTab({ url: '/pages/mine/index' })}
            >
              查看订单
            </Button>
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
        <>
          <View className={styles.notice}>
            <Text className={styles.noticeTitle}>候补规则</Text>
            <Text className={styles.noticeContent}>
              当有人取消预约或超时未到，系统会按候补顺序自动通知补位。请保持消息畅通，收到通知后15分钟内确认，否则名额顺延。
            </Text>
          </View>

          <View style={{ margin: '0 32rpx 24rpx' }}>
            <Button
              className={styles.addBtn}
              onClick={goToRegister}
            >
              + 新增候补
            </Button>
          </View>
        </>
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
