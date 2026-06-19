import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useUserStore } from '@/store/useUserStore';
import { useBookingStore } from '@/store/useBookingStore';
import { mockRooms, getRoomById } from '@/data/rooms';
import { generateDateList, getDayOfWeek, formatDate, generateTimeSlots, timeToMinutes } from '@/utils/timeUtils';
import { calculateFee } from '@/utils/feeCalculator';
import Tag from '@/components/Tag';
import classnames from 'classnames';
import styles from './index.module.scss';

const dateList = generateDateList(14);
const timeSlots = generateTimeSlots(9, 23, 60);

const WaitlistRegisterPage: React.FC = () => {
  const router = useRouter();
  const { userInfo } = useUserStore();
  const { joinWaitlist, waitlist } = useBookingStore();

  const initialRoomId = router.params.roomId || mockRooms[0]?.id || '';
  const initialDate = router.params.date || dateList[0];
  const initialStartTime = router.params.startTime || '';
  const initialEndTime = router.params.endTime || '';

  const [selectedRoomId, setSelectedRoomId] = useState(initialRoomId);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedStartTime, setSelectedStartTime] = useState(initialStartTime);
  const [selectedEndTime, setSelectedEndTime] = useState(initialEndTime);
  const [selectingEnd, setSelectingEnd] = useState(!!initialStartTime && !initialEndTime);

  const selectedRoom = useMemo(() => getRoomById(selectedRoomId), [selectedRoomId]);

  const estimatedPosition = useMemo(() => {
    if (!selectedRoomId || !selectedDate || !selectedStartTime || !selectedEndTime) return 0;
    const sameTimeWaitlist = waitlist.filter(
      w => w.roomId === selectedRoomId
        && w.date === selectedDate
        && w.startTime === selectedStartTime
        && w.endTime === selectedEndTime
        && w.status === 'waiting'
    );
    return sameTimeWaitlist.length + 1;
  }, [selectedRoomId, selectedDate, selectedStartTime, selectedEndTime, waitlist]);

  const estimatedFee = useMemo(() => {
    if (!selectedStartTime || !selectedEndTime) return 0;
    const { totalAmount } = calculateFee(selectedStartTime, selectedEndTime);
    return totalAmount;
  }, [selectedStartTime, selectedEndTime]);

  const canSubmit = useMemo(() => {
    return selectedRoomId && selectedDate && selectedStartTime && selectedEndTime;
  }, [selectedRoomId, selectedDate, selectedStartTime, selectedEndTime]);

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
    setSelectedStartTime('');
    setSelectedEndTime('');
    setSelectingEnd(false);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedStartTime('');
    setSelectedEndTime('');
    setSelectingEnd(false);
  };

  const handleTimeSlotClick = (time: string) => {
    if (!selectingEnd) {
      setSelectedStartTime(time);
      setSelectedEndTime('');
      setSelectingEnd(true);
    } else {
      const startMinutes = timeToMinutes(selectedStartTime);
      const endMinutes = timeToMinutes(time);
      if (endMinutes <= startMinutes) {
        setSelectedStartTime(time);
        setSelectedEndTime('');
        setSelectingEnd(true);
      } else {
        setSelectedEndTime(time);
        setSelectingEnd(false);
      }
    }
  };

  const isTimeDisabled = (time: string): boolean => {
    if (!selectingEnd) return false;
    const startMinutes = timeToMinutes(selectedStartTime);
    const currentMinutes = timeToMinutes(time);
    return currentMinutes <= startMinutes;
  };

  const isTimeInRange = (time: string): boolean => {
    if (!selectedStartTime || !selectedEndTime) return false;
    const startMinutes = timeToMinutes(selectedStartTime);
    const endMinutes = timeToMinutes(selectedEndTime);
    const currentMinutes = timeToMinutes(time);
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      Taro.showToast({ title: '请完善候补信息', icon: 'none' });
      return;
    }

    if (!userInfo || !selectedRoom) {
      Taro.showToast({ title: '信息不完整', icon: 'none' });
      return;
    }

    Taro.showModal({
      title: '确认候补',
      content: `确定要候补 ${selectedRoom.name} ${formatDate(selectedDate)} ${selectedStartTime}-${selectedEndTime} 的时段吗？`,
      success: (res) => {
        if (res.confirm) {
          const item = joinWaitlist(
            selectedRoomId,
            selectedRoom.name,
            userInfo.id,
            userInfo.name,
            selectedDate,
            selectedStartTime,
            selectedEndTime
          );

          console.log('[WaitlistRegister] 候补成功:', item.id, '排名:', item.position);
          Taro.showToast({ title: `候补成功，排名第${item.position}位`, icon: 'success' });

          setTimeout(() => {
            Taro.switchTab({ url: '/pages/waitlist/index' });
          }, 1500);
        }
      }
    });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>选择排练室</Text>
        </View>
        <ScrollView className={styles.roomSelector} scrollX>
          {mockRooms.filter(r => r.status === 'available').map(room => (
            <View
              key={room.id}
              className={classnames(styles.roomOption, selectedRoomId === room.id && styles.active)}
              onClick={() => handleRoomSelect(room.id)}
            >
              <Text className={styles.roomOptionName}>{room.name}</Text>
              <Text className={styles.roomOptionInfo}>{room.capacity}人 · {room.location}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>选择日期</Text>
        </View>
        <ScrollView className={styles.dateSelector} scrollX>
          {dateList.map((date, index) => (
            <View
              key={date}
              className={classnames(styles.dateOption, selectedDate === date && styles.active)}
              onClick={() => handleDateSelect(date)}
            >
              <Text className={styles.dateDay}>{index === 0 ? '今天' : index === 1 ? '明天' : '日期'}</Text>
              <Text className={styles.dateDate}>{date.split('-')[2]}</Text>
              <Text className={styles.dateWeekday}>{getDayOfWeek(date)}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>选择时段</Text>
          <Tag
            text={selectingEnd ? '选择结束时间' : '选择开始时间'}
            type={selectingEnd ? 'warning' : 'primary'}
            size="sm"
          />
        </View>
        <View className={styles.timeSlots}>
          {timeSlots.map((slot, index) => {
            const time = slot.startTime;
            const isSelected = time === selectedStartTime || time === selectedEndTime;
            const inRange = isTimeInRange(time);
            const disabled = isTimeDisabled(time);

            return (
              <View
                key={index}
                className={classnames(
                  styles.timeSlot,
                  isSelected && styles.active,
                  inRange && styles.active,
                  disabled && styles.disabled
                )}
                onClick={() => !disabled && handleTimeSlotClick(time)}
              >
                <Text className={styles.timeSlotText}>{time}</Text>
              </View>
            );
          })}
        </View>

        {selectedStartTime && selectedEndTime && (
          <View className={styles.summary}>
            <Text className={styles.summaryLabel}>已选时段</Text>
            <Text className={styles.summaryValue}>
              {selectedStartTime} - {selectedEndTime}
              {' · '}
              预估 ¥{estimatedFee.toFixed(2)}
            </Text>
          </View>
        )}
      </View>

      <View className={styles.notice}>
        <Text className={styles.noticeIcon}>📋</Text>
        <View className={styles.noticeContent}>
          <Text className={styles.noticeTitle}>候补规则</Text>
          <Text className={styles.noticeList}>
            <Text>• 当有人取消预约或超时未到，系统将按候补顺序自动通知补位</Text>
            {'\n'}
            <Text>• 收到补位通知后，请在15分钟内确认，否则名额顺延给下一位</Text>
            {'\n'}
            <Text>• 候补成功后，若无法前往请及时取消，避免影响他人</Text>
            {'\n'}
            <Text>• 候补期间不收取任何费用，补位成功后再支付</Text>
          </Text>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.positionInfo}>
          <Text className={styles.positionLabel}>当前预估排名</Text>
          <Text className={styles.positionValue}>
            {canSubmit ? `第 ${estimatedPosition} 位` : '--'}
          </Text>
          <Text className={styles.positionHint}>以实际提交为准</Text>
        </View>
        <Button
          className={classnames(styles.submitBtn, !canSubmit && styles.disabled)}
          onClick={handleSubmit}
        >
          提交候补
        </Button>
      </View>
    </ScrollView>
  );
};

export default WaitlistRegisterPage;
