import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useBookingStore } from '@/store/useBookingStore';
import { getAvailableRooms } from '@/data/rooms';
import { generateDateList, getDayOfWeek, formatDate, timeToMinutes, minutesToTime } from '@/utils/timeUtils';
import { getRateTypeByTime, getRatePrice, calculateFee, formatDuration } from '@/utils/feeCalculator';
import { BookingStatus } from '@/types';
import classnames from 'classnames';
import styles from './index.module.scss';

interface TimeSlotData {
  startTime: string;
  endTime: string;
  status: 'available' | 'booked';
  rateType: 'peak' | 'offpeak' | 'night';
  price: number;
}

const OCCUPIED_STATUSES: BookingStatus[] = ['pending', 'confirmed', 'in_use'];

const SchedulePage: React.FC = () => {
  const { setSelectedRoom, setSelectedDate, setSelectedTime, bookings, startTimeoutChecker, processTimeout } = useBookingStore();
  
  const rooms = getAvailableRooms();
  const dateList = generateDateList(14);
  
  const [currentRoomId, setCurrentRoomId] = useState<string>(rooms[0]?.id || '');
  const [currentDate, setCurrentDate] = useState<string>(dateList[0]);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<string | null>(null);
  const [selecting, setSelecting] = useState<'start' | 'end'>('start');

  useEffect(() => {
    startTimeoutChecker();
    processTimeout();
  }, [startTimeoutChecker, processTimeout]);

  const currentRoomBookings = useMemo(() => {
    return bookings.filter(
      b => b.roomId === currentRoomId
        && b.date === currentDate
        && OCCUPIED_STATUSES.includes(b.status)
    );
  }, [bookings, currentRoomId, currentDate]);

  const slots = useMemo(() => {
    const generatedSlots: TimeSlotData[] = [];
    const startHour = 9;
    const endHour = 24;

    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      const rateType = getRateTypeByTime(startTime);
      const price = getRatePrice(rateType);

      const slotStartMin = timeToMinutes(startTime);
      const slotEndMin = timeToMinutes(endTime);
      
      const isBooked = currentRoomBookings.some(booking => {
        const bookingStartMin = timeToMinutes(booking.startTime);
        const bookingEndMin = timeToMinutes(booking.endTime);
        return slotStartMin < bookingEndMin && slotEndMin > bookingStartMin;
      });

      generatedSlots.push({
        startTime,
        endTime,
        status: isBooked ? 'booked' : 'available',
        rateType,
        price
      });
    }

    return generatedSlots;
  }, [currentRoomId, currentDate, currentRoomBookings]);

  useEffect(() => {
    setSelectedRoom(currentRoomId);
    setSelectedDate(currentDate);
  }, [currentRoomId, currentDate, setSelectedRoom, setSelectedDate]);

  const handleSlotClick = (slot: TimeSlotData) => {
    if (slot.status === 'booked') {
      return;
    }

    if (selecting === 'start') {
      setSelectedStart(slot.startTime);
      setSelectedEnd(slot.endTime);
      setSelecting('end');
    } else {
      const startMin = timeToMinutes(selectedStart || slot.startTime);
      const clickMin = timeToMinutes(slot.startTime);
      
      if (clickMin < startMin) {
        setSelectedStart(slot.startTime);
        setSelectedEnd(slot.endTime);
        setSelecting('end');
      } else {
        const endMin = timeToMinutes(slot.endTime);
        const startIdx = slots.findIndex(s => s.startTime === selectedStart);
        const endIdx = slots.findIndex(s => s.startTime === slot.startTime);
        
        let hasBooked = false;
        for (let i = startIdx; i <= endIdx; i++) {
          if (slots[i].status === 'booked') {
            hasBooked = true;
            break;
          }
        }
        
        if (hasBooked) {
          Taro.showToast({ title: '包含已预约时段', icon: 'none' });
          return;
        }
        
        setSelectedEnd(minutesToTime(endMin));
        setSelecting('start');
      }
    }
  };

  const isSlotInRange = (slot: TimeSlotData): boolean => {
    if (!selectedStart || !selectedEnd) return false;
    const slotStart = timeToMinutes(slot.startTime);
    const selStart = timeToMinutes(selectedStart);
    const selEnd = timeToMinutes(selectedEnd);
    return slotStart >= selStart && slotStart < selEnd;
  };

  const totalFee = useMemo(() => {
    if (!selectedStart || !selectedEnd) return 0;
    const { totalAmount } = calculateFee(selectedStart, selectedEnd);
    return totalAmount;
  }, [selectedStart, selectedEnd]);

  const duration = useMemo(() => {
    if (!selectedStart || !selectedEnd) return '';
    const mins = timeToMinutes(selectedEnd) - timeToMinutes(selectedStart);
    return formatDuration(mins);
  }, [selectedStart, selectedEnd]);

  const handleRoomChange = (roomId: string) => {
    setCurrentRoomId(roomId);
    setSelectedStart(null);
    setSelectedEnd(null);
    setSelecting('start');
  };

  const handleDateChange = (date: string) => {
    setCurrentDate(date);
    setSelectedStart(null);
    setSelectedEnd(null);
    setSelecting('start');
  };

  const handleBook = () => {
    if (!selectedStart || !selectedEnd) {
      Taro.showToast({ title: '请选择时段', icon: 'none' });
      return;
    }
    setSelectedTime(selectedStart, selectedEnd);
    Taro.navigateTo({
      url: `/pages/booking-confirm/index?roomId=${currentRoomId}`
    });
  };

  const handleJoinWaitlist = () => {
    Taro.navigateTo({
      url: `/pages/waitlist-register/index?roomId=${currentRoomId}&date=${currentDate}`
    });
  };

  const hasAvailableSlots = slots.some(s => s.status === 'available');

  return (
    <View className={styles.page}>
      <View className={styles.roomSelector}>
        <ScrollView scrollX className={styles.roomTabs}>
          {rooms.map((room) => (
            <View
              key={room.id}
              className={classnames(styles.roomTab, currentRoomId === room.id && styles.active)}
              onClick={() => handleRoomChange(room.id)}
            >
              {room.name}
            </View>
          ))}
        </ScrollView>
      </View>

      <View className={styles.dateSelector}>
        <ScrollView scrollX className={styles.dateScroll}>
          {dateList.map((date) => {
            const day = parseInt(date.split('-')[2]);
            const month = parseInt(date.split('-')[1]);
            const isToday = date === formatDate(new Date());
            const isActive = date === currentDate;
            
            return (
              <View
                key={date}
                className={classnames(
                  styles.dateItem,
                  isActive && styles.active,
                  isToday && styles.today
                )}
                onClick={() => handleDateChange(date)}
              >
                <Text className={styles.dateWeek}>{getDayOfWeek(date).slice(1)}</Text>
                <Text className={styles.dateDay}>{day}</Text>
                <Text className={styles.dateMonth}>{month}月</Text>
              </View>
            );
          })}
        </ScrollView>
      </View>

      <View className={styles.legend}>
        <View className={styles.legendItem}>
          <View className={`${styles.legendDot} ${styles.available}`} />
          <Text className={styles.legendText}>可预约</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={`${styles.legendDot} ${styles.booked}`} />
          <Text className={styles.legendText}>已预约</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={`${styles.legendDot} ${styles.selected}`} />
          <Text className={styles.legendText}>已选择</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={`${styles.legendDot} ${styles.peak}`} />
          <Text className={styles.legendText}>高峰</Text>
        </View>
      </View>

      <View className={styles.timeSlots}>
        <Text className={styles.sectionTitle}>
          选择时段 {selecting === 'start' ? '(选择开始时间)' : '(选择结束时间)'}
        </Text>
        <View className={styles.slotGrid}>
          {slots.map((slot) => {
            const inRange = isSlotInRange(slot);
            return (
              <View
                key={slot.startTime}
                className={classnames(
                  styles.slotItem,
                  slot.status,
                  inRange && styles.selected,
                  slot.rateType === 'peak' && styles.peak
                )}
                onClick={() => handleSlotClick(slot)}
              >
                <Text className={styles.slotTime}>{slot.startTime}</Text>
                <Text className={styles.slotPrice}>¥{slot.price}</Text>
                {slot.rateType === 'peak' && slot.status === 'available' && (
                  <View className={`${styles.slotTag} ${styles.peak}`}>峰</View>
                )}
                {slot.status === 'booked' && (
                  <View className={styles.slotBookedTag}>已满</View>
                )}
              </View>
            );
          })}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.selectedInfo}>
          <Text className={styles.selectedLabel}>
            {selectedStart && selectedEnd ? '已选时段' : '请选择预约时段'}
          </Text>
          {selectedStart && selectedEnd ? (
            <>
              <Text className={styles.selectedTime}>
                {selectedStart} - {selectedEnd} ({duration})
              </Text>
              <View className={styles.selectedPrice}>
                <Text className={styles.priceSymbol}>¥</Text>
                <Text className={styles.priceValue}>{totalFee.toFixed(2)}</Text>
              </View>
            </>
          ) : (
            <Text className={styles.selectedTime}>点击时段开始选择</Text>
          )}
        </View>
        {hasAvailableSlots ? (
          <Button
            className={classnames(styles.bookButton, (!selectedStart || !selectedEnd) && styles.disabled)}
            onClick={handleBook}
          >
            立即预约
          </Button>
        ) : (
          <Button className={styles.waitlistButton} onClick={handleJoinWaitlist}>
            加入候补
          </Button>
        )}
      </View>
    </View>
  );
};

export default SchedulePage;
