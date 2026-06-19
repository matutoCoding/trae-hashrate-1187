// 排练室类型
export interface Room {
  id: string;
  name: string;
  description: string;
  capacity: number;
  equipments: string[];
  location: string;
  imageUrl: string;
  basePrice: number;
  status: 'available' | 'maintenance' | 'closed';
}

// 时段类型
export type TimeSlotStatus = 'available' | 'booked' | 'in_use' | 'released' | 'waitlist';

export interface TimeSlot {
  id: string;
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: TimeSlotStatus;
  price: number;
  rateType: RateType;
}

// 费率类型
export type RateType = 'peak' | 'offpeak' | 'night';

export interface RateRule {
  type: RateType;
  name: string;
  startTime: string;
  endTime: string;
  price: number;
  color: string;
}

// 预约类型
export type BookingStatus = 'pending' | 'confirmed' | 'in_use' | 'completed' | 'cancelled' | 'timeout';

export interface Booking {
  id: string;
  roomId: string;
  roomName: string;
  userId: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  totalPrice: number;
  feeBreakdown: FeeBreakdownItem[];
  equipmentRentals: EquipmentRental[];
  createdAt: string;
  timeoutAt: string;
}

// 费用明细
export interface FeeBreakdownItem {
  rateType: RateType;
  rateName: string;
  duration: number;
  unitPrice: number;
  amount: number;
  startTime: string;
  endTime: string;
}

// 乐器音响租借
export interface Equipment {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  imageUrl: string;
  available: number;
}

export interface EquipmentRental {
  equipmentId: string;
  equipmentName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// 候补队列
export type WaitlistStatus = 'waiting' | 'notified' | 'confirmed' | 'cancelled' | 'expired';

export interface WaitlistItem {
  id: string;
  roomId: string;
  roomName: string;
  userId: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
  position: number;
  status: WaitlistStatus;
  createdAt: string;
  notifiedAt?: string;
}

// 账单类型
export type BillStatus = 'pending' | 'paid' | 'refunded' | 'cancelled';

export interface Bill {
  id: string;
  bookingId: string;
  roomId: string;
  roomName: string;
  userId: string;
  totalAmount: number;
  roomFee: number;
  equipmentFee: number;
  feeBreakdown: FeeBreakdownItem[];
  equipmentRentals: EquipmentRental[];
  status: BillStatus;
  createdAt: string;
  paidAt?: string;
}

// 用户信息
export interface UserInfo {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  balance: number;
}
