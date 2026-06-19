import React, { useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useBookingStore } from '@/store/useBookingStore';
import { formatDate, getDayOfWeek } from '@/utils/timeUtils';
import { getRateColor, formatDuration } from '@/utils/feeCalculator';
import classnames from 'classnames';
import styles from './index.module.scss';

const BillDetailPage: React.FC = () => {
  const router = useRouter();
  const bookingId = router.params.bookingId || '';

  const { getBillByBookingId, getBookingById, payBill } = useBookingStore();

  const bill = getBillByBookingId(bookingId);
  const booking = getBookingById(bookingId);

  const handlePay = () => {
    if (!bill) return;

    Taro.showModal({
      title: '确认支付',
      content: `确认支付 ¥${bill.totalAmount.toFixed(2)} 吗？`,
      success: (res) => {
        if (res.confirm) {
          payBill(bill.id);
          Taro.showToast({ title: '支付成功', icon: 'success' });
          console.log('[BillDetail] 支付账单:', bill.id);
        }
      }
    });
  };

  const handleBackToMine = () => {
    Taro.switchTab({ url: '/pages/mine/index' });
  };

  const statusText = {
    pending: '待支付',
    paid: '已支付',
    refunded: '已退款',
    cancelled: '已取消'
  }[bill?.status || 'pending'] || '未知';

  if (!bill || !booking) {
    return (
      <View className={styles.page}>
        <View style={{ padding: 100, textAlign: 'center' }}>
          <Text>账单信息不存在</Text>
          <Button
            style={{ marginTop: 32, width: 200 }}
            onClick={handleBackToMine}
          >
            返回我的
          </Button>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={classnames(styles.statusBanner, styles[bill.status])}>
        <Text className={styles.statusTitle}>{statusText}</Text>
        <Text className={styles.statusDesc}>
          {bill.status === 'pending' && '请在15分钟内完成支付'}
          {bill.status === 'paid' && '感谢您的使用'}
          {bill.status === 'refunded' && '退款已原路返回'}
          {bill.status === 'cancelled' && '订单已取消'}
        </Text>
      </View>

      <View className={styles.amountSection}>
        <Text className={styles.amountLabel}>支付金额</Text>
        <View className={styles.amountValue}>
          <Text className={styles.symbol}>¥</Text>
          {bill.totalAmount.toFixed(2)}
        </View>
        {bill.status === 'pending' && (
          <Button className={styles.amountBtn} onClick={handlePay}>
            立即支付
          </Button>
        )}
        {bill.status === 'paid' && (
          <Button className={`${styles.amountBtn} ${styles.paid}`} disabled>
            已支付
          </Button>
        )}
        {bill.status === 'cancelled' && (
          <Button
            className={`${styles.amountBtn} ${styles.cancelled}`}
            onClick={handleBackToMine}
          >
            返回我的
          </Button>
        )}
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>预约信息</Text>
        </View>
        <View className={styles.sectionBody}>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>排练室</Text>
            <Text className={styles.infoValue}>{bill.roomName}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>日期</Text>
            <Text className={styles.infoValue}>
              {formatDate(booking.date)} {getDayOfWeek(booking.date)}
            </Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>时段</Text>
            <Text className={styles.infoValue}>
              {booking.startTime} - {booking.endTime}
            </Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>时长</Text>
            <Text className={styles.infoValue}>
              {formatDuration(
                (parseInt(booking.endTime.split(':')[0]) - parseInt(booking.startTime.split(':')[0])) * 60
              )}
            </Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>费用明细</Text>
        </View>
        <View className={styles.sectionBody}>
          <View className={styles.feeList}>
            {bill.feeBreakdown.map((item, index) => (
              <View key={index} className={styles.feeItem}>
                <View className={styles.feeLeft}>
                  <View
                    className={classnames(styles.feeDot, styles[item.rateType])}
                    style={{ backgroundColor: getRateColor(item.rateType) }}
                  />
                  <View>
                    <Text className={styles.feeName}>{item.rateName}</Text>
                    <View className={styles.feeDuration}>
                      {item.startTime} - {item.endTime} · {formatDuration(item.duration)}
                    </View>
                  </View>
                </View>
                <Text className={styles.feeAmount}>¥{item.amount.toFixed(2)}</Text>
              </View>
            ))}
          </View>
          
          <View className={styles.totalRow}>
            <Text className={styles.totalLabel}>场地费用小计</Text>
            <Text className={styles.totalValue}>¥{bill.roomFee.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {bill.equipmentRentals.length > 0 && (
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>设备租借</Text>
          </View>
          <View className={styles.sectionBody}>
            {bill.equipmentRentals.map((item, index) => (
              <View key={index} className={styles.equipmentItem}>
                <View className={styles.equipmentInfo}>
                  <Text className={styles.equipmentName}>{item.equipmentName}</Text>
                  <Text className={styles.equipmentQty}>
                    ×{item.quantity}  ¥{item.unitPrice}/次
                  </Text>
                </View>
                <Text className={styles.equipmentPrice}>¥{item.totalPrice.toFixed(2)}</Text>
              </View>
            ))}
            
            <View className={styles.totalRow}>
              <Text className={styles.totalLabel}>设备费用小计</Text>
              <Text className={styles.totalValue}>¥{bill.equipmentFee.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      )}

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>账单信息</Text>
        </View>
        <View className={styles.sectionBody}>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>账单编号</Text>
            <Text className={styles.infoValue}>{bill.id}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>创建时间</Text>
            <Text className={styles.infoValue}>
              {formatDate(bill.createdAt, 'YYYY-MM-DD HH:mm')}
            </Text>
          </View>
          {bill.paidAt && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>支付时间</Text>
              <Text className={styles.infoValue}>
                {formatDate(bill.paidAt, 'YYYY-MM-DD HH:mm')}
              </Text>
            </View>
          )}
        </View>
      </View>

      {bill.status === 'pending' && (
        <View style={{ margin: '32rpx', textAlign: 'center' }}>
          <Text style={{ fontSize: '24rpx', color: '#86909C' }}>
            超时未支付订单将自动取消
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

export default BillDetailPage;
