import { Booking, FeeBreakdownItem } from '@/types';
import dayjs from 'dayjs';

const generateFeeBreakdown = (startTime: string, endTime: string): { total: number; breakdown: FeeBreakdownItem[] } => {
  const startHour = parseInt(startTime.split(':')[0]);
  const endHour = parseInt(endTime.split(':')[0]);
  const breakdown: FeeBreakdownItem[] = [];
  let total = 0;

  if (startHour < 17 && endHour <= 17) {
    const hours = endHour - startHour;
    breakdown.push({
      rateType: 'offpeak',
      rateName: '平峰时段',
      duration: hours * 60,
      unitPrice: 80,
      amount: hours * 80,
      startTime,
      endTime
    });
    total = hours * 80;
  } else if (startHour >= 17 && endHour <= 22) {
    const hours = endHour - startHour;
    breakdown.push({
      rateType: 'peak',
      rateName: '高峰时段',
      duration: hours * 60,
      unitPrice: 120,
      amount: hours * 120,
      startTime,
      endTime
    });
    total = hours * 120;
  } else {
    if (startHour < 17) {
      const offpeakHours = 17 - startHour;
      breakdown.push({
        rateType: 'offpeak',
        rateName: '平峰时段',
        duration: offpeakHours * 60,
        unitPrice: 80,
        amount: offpeakHours * 80,
        startTime,
        endTime: '17:00'
      });
      total += offpeakHours * 80;

      const peakHours = Math.min(endHour, 22) - 17;
      if (peakHours > 0) {
        breakdown.push({
          rateType: 'peak',
          rateName: '高峰时段',
          duration: peakHours * 60,
          unitPrice: 120,
          amount: peakHours * 120,
          startTime: '17:00',
          endTime: `${Math.min(endHour, 22)}:00`
        });
        total += peakHours * 120;
      }

      if (endHour > 22) {
        const nightHours = endHour - 22;
        breakdown.push({
          rateType: 'night',
          rateName: '夜间时段',
          duration: nightHours * 60,
          unitPrice: 100,
          amount: nightHours * 100,
          startTime: '22:00',
          endTime
        });
        total += nightHours * 100;
      }
    } else if (startHour < 22 && endHour > 22) {
      const peakHours = 22 - startHour;
      breakdown.push({
        rateType: 'peak',
        rateName: '高峰时段',
        duration: peakHours * 60,
        unitPrice: 120,
        amount: peakHours * 120,
        startTime,
        endTime: '22:00'
      });
      total += peakHours * 120;

      const nightHours = endHour - 22;
      breakdown.push({
        rateType: 'night',
        rateName: '夜间时段',
        duration: nightHours * 60,
        unitPrice: 100,
        amount: nightHours * 100,
        startTime: '22:00',
        endTime
      });
      total += nightHours * 100;
    }
  }

  return { total, breakdown };
};

export const mockBookings: Booking[] = [
  {
    id: 'bk-001',
    roomId: 'room-001',
    roomName: '星空排练室 A',
    userId: 'user-001',
    userName: '张小明',
    date: dayjs().format('YYYY-MM-DD'),
    startTime: '19:00',
    endTime: '22:00',
    status: 'confirmed',
    totalPrice: 360,
    feeBreakdown: generateFeeBreakdown('19:00', '22:00').breakdown,
    equipmentRentals: [
      { equipmentId: 'eq-005', equipmentName: '专业麦克风', quantity: 2, unitPrice: 20, totalPrice: 40 }
    ],
    createdAt: dayjs().subtract(2, 'day').toISOString(),
    timeoutAt: dayjs().add(15, 'minute').toISOString()
  },
  {
    id: 'bk-002',
    roomId: 'room-002',
    roomName: '极光排练室 B',
    userId: 'user-001',
    userName: '张小明',
    date: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    startTime: '14:00',
    endTime: '18:00',
    status: 'pending',
    totalPrice: 360,
    feeBreakdown: generateFeeBreakdown('14:00', '18:00').breakdown,
    equipmentRentals: [],
    createdAt: dayjs().subtract(1, 'day').toISOString(),
    timeoutAt: dayjs().add(20, 'minute').toISOString()
  },
  {
    id: 'bk-003',
    roomId: 'room-003',
    roomName: '回响排练室 C',
    userId: 'user-001',
    userName: '张小明',
    date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
    startTime: '10:00',
    endTime: '12:00',
    status: 'completed',
    totalPrice: 160,
    feeBreakdown: generateFeeBreakdown('10:00', '12:00').breakdown,
    equipmentRentals: [
      { equipmentId: 'eq-001', equipmentName: '电吉他', quantity: 1, unitPrice: 30, totalPrice: 30 }
    ],
    createdAt: dayjs().subtract(3, 'day').toISOString(),
    timeoutAt: dayjs().subtract(1, 'day').add(10, 'minute').toISOString()
  },
  {
    id: 'bk-004',
    roomId: 'room-005',
    roomName: '和声排练室 E',
    userId: 'user-001',
    userName: '张小明',
    date: dayjs().subtract(2, 'day').format('YYYY-MM-DD'),
    startTime: '20:00',
    endTime: '23:00',
    status: 'cancelled',
    totalPrice: 340,
    feeBreakdown: generateFeeBreakdown('20:00', '23:00').breakdown,
    equipmentRentals: [],
    createdAt: dayjs().subtract(5, 'day').toISOString(),
    timeoutAt: dayjs().subtract(2, 'day').add(15, 'minute').toISOString()
  }
];

export const getBookingById = (id: string): Booking | undefined => {
  return mockBookings.find(b => b.id === id);
};

export const getBookingsByUser = (userId: string): Booking[] => {
  return mockBookings.filter(b => b.userId === userId);
};

export const getBookingsByRoomAndDate = (roomId: string, date: string): Booking[] => {
  return mockBookings.filter(b => b.roomId === roomId && b.date === date);
};
