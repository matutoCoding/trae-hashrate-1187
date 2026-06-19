import { create } from 'zustand';
import { Booking, WaitlistItem, Bill, EquipmentRental, FeeBreakdownItem } from '@/types';
import { mockBookings } from '@/data/bookings';
import { mockWaitlist } from '@/data/waitlists';
import { mockBills } from '@/data/bills';
import { calculateFee } from '@/utils/feeCalculator';

interface BookingState {
  selectedRoomId: string | null;
  selectedDate: string;
  selectedStartTime: string | null;
  selectedEndTime: string | null;
  selectedEquipments: EquipmentRental[];
  bookings: Booking[];
  waitlist: WaitlistItem[];
  bills: Bill[];

  setSelectedRoom: (roomId: string) => void;
  setSelectedDate: (date: string) => void;
  setSelectedTime: (start: string, end: string) => void;
  addEquipment: (equipment: EquipmentRental) => void;
  removeEquipment: (equipmentId: string) => void;
  clearSelection: () => void;

  createBooking: (roomId: string, roomName: string, userId: string, userName: string) => Booking;
  cancelBooking: (bookingId: string) => void;

  joinWaitlist: (roomId: string, roomName: string, userId: string, userName: string, date: string, startTime: string, endTime: string) => WaitlistItem;
  cancelWaitlist: (waitlistId: string) => void;

  getBookingsByUser: (userId: string) => Booking[];
  getWaitlistByUser: (userId: string) => WaitlistItem[];
  getBillsByUser: (userId: string) => Bill[];

  calculateTotalFee: () => number;
  getFeeBreakdown: () => FeeBreakdownItem[];
}

export const useBookingStore = create<BookingState>((set, get) => ({
  selectedRoomId: null,
  selectedDate: new Date().toISOString().split('T')[0],
  selectedStartTime: null,
  selectedEndTime: null,
  selectedEquipments: [],
  bookings: mockBookings,
  waitlist: mockWaitlist,
  bills: mockBills,

  setSelectedRoom: (roomId) => set({ selectedRoomId: roomId }),

  setSelectedDate: (date) => set({ selectedDate: date, selectedStartTime: null, selectedEndTime: null }),

  setSelectedTime: (start, end) => set({ selectedStartTime: start, selectedEndTime: end }),

  addEquipment: (equipment) => set((state) => {
    const existing = state.selectedEquipments.find(e => e.equipmentId === equipment.equipmentId);
    if (existing) {
      return {
        selectedEquipments: state.selectedEquipments.map(e =>
          e.equipmentId === equipment.equipmentId
            ? { ...e, quantity: e.quantity + equipment.quantity, totalPrice: (e.quantity + equipment.quantity) * e.unitPrice }
            : e
        )
      };
    }
    return { selectedEquipments: [...state.selectedEquipments, equipment] };
  }),

  removeEquipment: (equipmentId) => set((state) => ({
    selectedEquipments: state.selectedEquipments.filter(e => e.equipmentId !== equipmentId)
  })),

  clearSelection: () => set({
    selectedRoomId: null,
    selectedStartTime: null,
    selectedEndTime: null,
    selectedEquipments: []
  }),

  createBooking: (roomId, roomName, userId, userName) => {
    const state = get();
    const { totalAmount, breakdown } = calculateFee(
      state.selectedStartTime || '09:00',
      state.selectedEndTime || '10:00'
    );
    const equipmentTotal = state.selectedEquipments.reduce((sum, e) => sum + e.totalPrice, 0);

    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      roomId,
      roomName,
      userId,
      userName,
      date: state.selectedDate,
      startTime: state.selectedStartTime || '09:00',
      endTime: state.selectedEndTime || '10:00',
      status: 'pending',
      totalPrice: totalAmount + equipmentTotal,
      feeBreakdown: breakdown,
      equipmentRentals: state.selectedEquipments,
      createdAt: new Date().toISOString(),
      timeoutAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    };

    set((state) => ({
      bookings: [newBooking, ...state.bookings]
    }));

    console.log('[BookingStore] 创建预约:', newBooking.id);
    return newBooking;
  },

  cancelBooking: (bookingId) => set((state) => ({
    bookings: state.bookings.map(b =>
      b.id === bookingId ? { ...b, status: 'cancelled' } : b
    )
  })),

  joinWaitlist: (roomId, roomName, userId, userName, date, startTime, endTime) => {
    const roomWaitlist = get().waitlist.filter(
      w => w.roomId === roomId && w.date === date && w.startTime === startTime && w.endTime === endTime && w.status === 'waiting'
    );
    const position = roomWaitlist.length + 1;

    const newWaitlistItem: WaitlistItem = {
      id: `wl-${Date.now()}`,
      roomId,
      roomName,
      userId,
      userName,
      date,
      startTime,
      endTime,
      position,
      status: 'waiting',
      createdAt: new Date().toISOString()
    };

    set((state) => ({
      waitlist: [newWaitlistItem, ...state.waitlist]
    }));

    console.log('[BookingStore] 加入候补:', newWaitlistItem.id, '排名:', position);
    return newWaitlistItem;
  },

  cancelWaitlist: (waitlistId) => set((state) => ({
    waitlist: state.waitlist.map(w =>
      w.id === waitlistId ? { ...w, status: 'cancelled' } : w
    )
  })),

  getBookingsByUser: (userId) => get().bookings.filter(b => b.userId === userId),

  getWaitlistByUser: (userId) => get().waitlist.filter(w => w.userId === userId),

  getBillsByUser: (userId) => get().bills.filter(b => b.userId === userId),

  calculateTotalFee: () => {
    const state = get();
    if (!state.selectedStartTime || !state.selectedEndTime) return 0;
    const { totalAmount } = calculateFee(state.selectedStartTime, state.selectedEndTime);
    const equipmentTotal = state.selectedEquipments.reduce((sum, e) => sum + e.totalPrice, 0);
    return Number((totalAmount + equipmentTotal).toFixed(2));
  },

  getFeeBreakdown: () => {
    const state = get();
    if (!state.selectedStartTime || !state.selectedEndTime) return [];
    const { breakdown } = calculateFee(state.selectedStartTime, state.selectedEndTime);
    return breakdown;
  }
}));
