import { Bill, FeeBreakdownItem } from '@/types';
import dayjs from 'dayjs';

const generateFeeBreakdown = (startTime: string, endTime: string): FeeBreakdownItem[] => {
  const startHour = parseInt(startTime.split(':')[0]);
  const endHour = parseInt(endTime.split(':')[0]);
  const breakdown: FeeBreakdownItem[] = [];

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
  } else if (startHour < 17) {
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
  }

  return breakdown;
};

export const mockBills: Bill[] = [
  {
    id: 'bl-001',
    bookingId: 'bk-003',
    roomId: 'room-003',
    roomName: '回响排练室 C',
    userId: 'user-001',
    totalAmount: 190,
    roomFee: 160,
    equipmentFee: 30,
    feeBreakdown: generateFeeBreakdown('10:00', '12:00'),
    equipmentRentals: [
      { equipmentId: 'eq-001', equipmentName: '电吉他', quantity: 1, unitPrice: 30, totalPrice: 30 }
    ],
    status: 'paid',
    createdAt: dayjs().subtract(3, 'day').toISOString(),
    paidAt: dayjs().subtract(3, 'day').add(10, 'minute').toISOString()
  },
  {
    id: 'bl-002',
    bookingId: 'bk-004',
    roomId: 'room-005',
    roomName: '和声排练室 E',
    userId: 'user-001',
    totalAmount: 340,
    roomFee: 340,
    equipmentFee: 0,
    feeBreakdown: generateFeeBreakdown('20:00', '23:00'),
    equipmentRentals: [],
    status: 'cancelled',
    createdAt: dayjs().subtract(5, 'day').toISOString()
  },
  {
    id: 'bl-003',
    bookingId: 'bk-001',
    roomId: 'room-001',
    roomName: '星空排练室 A',
    userId: 'user-001',
    totalAmount: 400,
    roomFee: 360,
    equipmentFee: 40,
    feeBreakdown: generateFeeBreakdown('19:00', '22:00'),
    equipmentRentals: [
      { equipmentId: 'eq-005', equipmentName: '专业麦克风', quantity: 2, unitPrice: 20, totalPrice: 40 }
    ],
    status: 'pending',
    createdAt: dayjs().subtract(2, 'day').toISOString()
  }
];

export const getBillById = (id: string): Bill | undefined => {
  return mockBills.find(b => b.id === id);
};

export const getBillsByUser = (userId: string): Bill[] => {
  return mockBills.filter(b => b.userId === userId);
};

export const getBillByBookingId = (bookingId: string): Bill | undefined => {
  return mockBills.find(b => b.bookingId === bookingId);
};
