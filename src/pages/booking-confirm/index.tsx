import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useUserStore } from '@/store/useUserStore';
import { useBookingStore } from '@/store/useBookingStore';
import { getRoomById } from '@/data/rooms';
import { mockEquipments } from '@/data/equipments';
import { formatDate, getDayOfWeek, formatDuration } from '@/utils/timeUtils';
import { calculateFee, getRateColor } from '@/utils/feeCalculator';
import { Equipment, EquipmentRental } from '@/types';
import Tag from '@/components/Tag';
import classnames from 'classnames';
import styles from './index.module.scss';

interface EquipmentSelection {
  equipmentId: string;
  quantity: number;
}

const BookingConfirmPage: React.FC = () => {
  const router = useRouter();
  const { userInfo } = useUserStore();
  const {
    selectedDate,
    selectedStartTime,
    selectedEndTime,
    createBooking,
    addEquipment,
    removeEquipment,
    selectedEquipments,
    calculateTotalFee,
    getFeeBreakdown
  } = useBookingStore();

  const roomId = router.params.roomId || '';
  const room = getRoomById(roomId);
  const feeBreakdown = getFeeBreakdown();
  const baseFee = calculateTotalFee();

  const [equipmentQuantities, setEquipmentQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    console.log('[BookingConfirm] 页面加载，房间ID:', roomId);
  }, [roomId]);

  const totalFee = useMemo(() => {
    const equipmentTotal = selectedEquipments.reduce((sum, e) => sum + e.totalPrice, 0);
    return Number((baseFee + equipmentTotal).toFixed(2));
  }, [baseFee, selectedEquipments]);

  const handleQuantityChange = (equipment: Equipment, delta: number) => {
    setEquipmentQuantities(prev => {
      const current = prev[equipment.id] || 0;
      const newValue = Math.max(0, Math.min(equipment.available, current + delta));
      
      const rental: EquipmentRental = {
        equipmentId: equipment.id,
        equipmentName: equipment.name,
        quantity: newValue,
        unitPrice: equipment.price,
        totalPrice: newValue * equipment.price
      };

      if (newValue === 0) {
        removeEquipment(equipment.id);
        const { [equipment.id]: _, ...rest } = prev;
        return rest;
      } else {
        if (current === 0) {
          addEquipment(rental);
        } else {
          addEquipment(rental);
        }
        return { ...prev, [equipment.id]: newValue };
      }
    });
  };

  const handleSubmit = () => {
    if (!room || !userInfo) {
      Taro.showToast({ title: '信息不完整', icon: 'none' });
      return;
    }

    if (!selectedStartTime || !selectedEndTime) {
      Taro.showToast({ title: '请选择时段', icon: 'none' });
      return;
    }

    console.log('[BookingConfirm] 提交预约', {
      roomId,
      startTime: selectedStartTime,
      endTime: selectedEndTime,
      totalFee,
      equipments: selectedEquipments
    });

    const booking = createBooking(room.id, room.name, userInfo.id, userInfo.name);
    
    Taro.showToast({ title: '预约成功', icon: 'success' });
    
    setTimeout(() => {
      Taro.redirectTo({
        url: `/pages/bill-detail/index?bookingId=${booking.id}`
      });
    }, 1500);
  };

  if (!room) {
    return (
      <View className={styles.page}>
        <View style={{ padding: 100, textAlign: 'center' }}>
          <Text>房间信息不存在</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>排练室信息</Text>
        </View>
        <View className={styles.sectionBody}>
          <View className={styles.roomInfo}>
            <Image
              className={styles.roomImage}
              src={room.imageUrl}
              mode="aspectFill"
            />
            <View className={styles.roomText}>
              <Text className={styles.roomName}>{room.name}</Text>
              <Text className={styles.roomDesc}>{room.description}</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>预约时段</Text>
        </View>
        <View className={styles.sectionBody}>
          <View className={styles.timeInfo}>
            <View className={styles.timeItem}>
              <Text className={styles.timeLabel}>开始时间</Text>
              <Text className={styles.timeValue}>{selectedStartTime || '--:--'}</Text>
            </View>
            <View className={styles.timeDivider} />
            <View className={styles.timeItem}>
              <Text className={styles.timeLabel}>结束时间</Text>
              <Text className={styles.timeValue}>{selectedEndTime || '--:--'}</Text>
            </View>
          </View>
          <View className={styles.duration}>
            <Text className={styles.durationText}>
              {formatDate(selectedDate)} {getDayOfWeek(selectedDate)}
              {' · '}
              <Text className={styles.highlight}>
                {formatDuration(
                  (parseInt(selectedEndTime?.split(':')[0] || '0') - parseInt(selectedStartTime?.split(':')[0] || '0')) * 60
                )}
              </Text>
            </Text>
          </View>
        </View>
      </View>

      <View className={`${styles.section} ${styles.feeSection}`}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>费用明细</Text>
        </View>
        <View className={styles.sectionBody}>
          <View className={styles.feeTotal}>
            <Text className={styles.feeSymbol}>¥</Text>
            <Text className={styles.feeValue}>{baseFee.toFixed(2)}</Text>
          </View>
          <View className={styles.feeBreakdown}>
            {feeBreakdown.map((item, index) => (
              <View key={index} className={styles.breakdownItem}>
                <View className={styles.breakdownLeft}>
                  <View
                    className={classnames(styles.breakdownTag, styles[item.rateType])}
                    style={{ backgroundColor: getRateColor(item.rateType) }}
                  />
                  <Text className={styles.breakdownName}>{item.rateName}</Text>
                  <Text className={styles.breakdownTime}>
                    {item.startTime}-{item.endTime}
                  </Text>
                </View>
                <View className={styles.breakdownRight}>
                  <Text className={styles.breakdownPrice}>
                    ¥{item.amount.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
            {feeBreakdown.length === 0 && (
              <Text style={{ color: '#86909C', fontSize: '24rpx', textAlign: 'center' }}>
                请先选择时段
              </Text>
            )}
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>乐器/设备租借</Text>
          <Tag text="可选" type="primary" size="sm" />
        </View>
        <View className={styles.sectionBody}>
          <View className={styles.equipmentList}>
            {mockEquipments.slice(0, 4).map((eq) => {
              const qty = equipmentQuantities[eq.id] || 0;
              const isSelected = qty > 0;
              return (
                <View
                  key={eq.id}
                  className={classnames(styles.equipmentItem, isSelected && styles.selected)}
                >
                  <Image
                    className={styles.equipmentImage}
                    src={eq.imageUrl}
                    mode="aspectFill"
                  />
                  <View className={styles.equipmentInfo}>
                    <Text className={styles.equipmentName}>{eq.name}</Text>
                    <Text className={styles.equipmentDesc}>库存 {eq.available} 件</Text>
                    <View className={styles.quantityControl}>
                      <View
                        className={styles.quantityBtn}
                        onClick={() => handleQuantityChange(eq, -1)}
                      >
                        <Text>−</Text>
                      </View>
                      <Text className={styles.quantityNum}>{qty}</Text>
                      <View
                        className={styles.quantityBtn}
                        onClick={() => handleQuantityChange(eq, 1)}
                      >
                        <Text>+</Text>
                      </View>
                    </View>
                  </View>
                  <View style={{ textAlign: 'right' }}>
                    <Text className={styles.equipmentPrice}>
                      ¥{eq.price}
                    </Text>
                    <Text className={styles.equipmentUnit}>/{eq.unit}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <View className={styles.notice}>
        <Text className={styles.noticeIcon}>⏰</Text>
        <Text className={styles.noticeText}>
          预约成功后请在15分钟内完成支付，超时未支付订单将自动取消，名额释放给候补用户。
        </Text>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.totalInfo}>
          <Text className={styles.totalLabel}>合计金额</Text>
          <View className={styles.totalPrice}>
            <Text className={styles.symbol}>¥</Text>
            <Text className={styles.value}>{totalFee.toFixed(2)}</Text>
          </View>
        </View>
        <Button
          className={classnames(styles.submitBtn, (!selectedStartTime || !selectedEndTime) && styles.disabled)}
          onClick={handleSubmit}
        >
          确认预约
        </Button>
      </View>
    </ScrollView>
  );
};

export default BookingConfirmPage;
