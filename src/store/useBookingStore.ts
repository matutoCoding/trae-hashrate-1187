import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Booking, WaitlistItem, Bill, EquipmentRental, FeeBreakdownItem } from '@/types';
import { mockBookings } from '@/data/bookings';
import { mockWaitlist } from '@/data/waitlists';
import { mockBills } from '@/data/bills';
import { calculateFee } from '@/utils/feeCalculator';
import Taro from '@tarojs/taro';

const taroStorage = {
  getItem: async (name: string) => {
    try {
      return Taro.getStorageSync(name);
    } catch (e) {
      console.error('[Storage] getItem error:', e);
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    try {
      Taro.setStorageSync(name, value);
    } catch (e) {
      console.error('[Storage] setItem error:', e);
    }
  },
  removeItem: async (name: string) => {
    try {
      Taro.removeStorageSync(name);
    } catch (e) {
      console.error('[Storage] removeItem error:', e);
    }
  },
};

interface BookingState {
  selectedRoomId: string | null;
  selectedDate: string;
  selectedStartTime: string | null;
  selectedEndTime: string | null;
  selectedEquipments: EquipmentRental[];
  bookings: Booking[];
  waitlist: WaitlistItem[];
  bills: Bill[];
  timeoutChecker: NodeJS.Timeout | null;

  setSelectedRoom: (roomId: string) => void;
  setSelectedDate: (date: string) => void;
  setSelectedTime: (start: string, end: string) => void;
  addEquipment: (equipment: EquipmentRental) => void;
  updateEquipmentQuantity: (equipmentId: string, quantity: number) => void;
  removeEquipment: (equipmentId: string) => void;
  clearSelection: () => void;

  createBill: (booking: Booking) => Bill;
  createBooking: (roomId: string, roomName: string, userId: string, userName: string) => { booking: Booking; bill: Bill };
  cancelBooking: (bookingId: string) => void;
  payBill: (billId: string) => void;

  joinWaitlist: (roomId: string, roomName: string, userId: string, userName: string, date: string, startTime: string, endTime: string) => WaitlistItem;
  cancelWaitlist: (waitlistId: string) => void;
  confirmWaitlist: (waitlistId: string) => { booking: Booking; bill: Bill } | null;
  declineWaitlist: (waitlistId: string) => void;

  processTimeout: () => void;
  startTimeoutChecker: () => void;
  stopTimeoutChecker: () => void;

  getBookingsByUser: (userId: string) => Booking[];
  getWaitlistByUser: (userId: string) => WaitlistItem[];
  getBillsByUser: (userId: string) => Bill[];
  getBillByBookingId: (bookingId: string) => Bill | undefined;
  getBookingById: (bookingId: string) => Booking | undefined;

  calculateTotalFee: () => number;
  getFeeBreakdown: () => FeeBreakdownItem[];

  recalculateWaitlistPositions: (roomId: string, date: string, startTime: string, endTime: string) => void;
  notifyNextWaitlist: (roomId: string, date: string, startTime: string, endTime: string) => WaitlistItem | null;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      selectedRoomId: null,
      selectedDate: new Date().toISOString().split('T')[0],
      selectedStartTime: null,
      selectedEndTime: null,
      selectedEquipments: [],
      bookings: mockBookings,
      waitlist: mockWaitlist,
      bills: mockBills,
      timeoutChecker: null,

      setSelectedRoom: (roomId) => set({ selectedRoomId: roomId }),

      setSelectedDate: (date) => set({ selectedDate: date, selectedStartTime: null, selectedEndTime: null }),

      setSelectedTime: (start, end) => set({ selectedStartTime: start, selectedEndTime: end }),

      addEquipment: (equipment) => set((state) => {
        const existing = state.selectedEquipments.find(e => e.equipmentId === equipment.equipmentId);
        if (existing) {
          return {
            selectedEquipments: state.selectedEquipments.map(e =>
              e.equipmentId === equipment.equipmentId
                ? { ...e, quantity: equipment.quantity, totalPrice: equipment.quantity * e.unitPrice }
                : e
            )
          };
        }
        return { selectedEquipments: [...state.selectedEquipments, equipment] };
      }),

      updateEquipmentQuantity: (equipmentId, quantity) => set((state) => {
        if (quantity <= 0) {
          return {
            selectedEquipments: state.selectedEquipments.filter(e => e.equipmentId !== equipmentId)
          };
        }
        const existing = state.selectedEquipments.find(e => e.equipmentId === equipmentId);
        if (existing) {
          return {
            selectedEquipments: state.selectedEquipments.map(e =>
              e.equipmentId === equipmentId
                ? { ...e, quantity, totalPrice: quantity * e.unitPrice }
                : e
            )
          };
        }
        return state;
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

      createBill: (booking) => {
        const roomFee = booking.feeBreakdown.reduce((sum, item) => sum + item.amount, 0);
        const equipmentFee = booking.equipmentRentals.reduce((sum, item) => sum + item.totalPrice, 0);

        const newBill: Bill = {
          id: `bl-${Date.now()}`,
          bookingId: booking.id,
          roomId: booking.roomId,
          roomName: booking.roomName,
          userId: booking.userId,
          totalAmount: Number((roomFee + equipmentFee).toFixed(2)),
          roomFee: Number(roomFee.toFixed(2)),
          equipmentFee: Number(equipmentFee.toFixed(2)),
          feeBreakdown: booking.feeBreakdown,
          equipmentRentals: booking.equipmentRentals,
          status: 'pending',
          createdAt: new Date().toISOString()
        };

        set((state) => ({
          bills: [newBill, ...state.bills]
        }));

        console.log('[BookingStore] 创建账单:', newBill.id, '金额:', newBill.totalAmount);
        return newBill;
      },

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
          totalPrice: Number((totalAmount + equipmentTotal).toFixed(2)),
          feeBreakdown: breakdown,
          equipmentRentals: [...state.selectedEquipments],
          createdAt: new Date().toISOString(),
          timeoutAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        };

        set((state) => ({
          bookings: [newBooking, ...state.bookings]
        }));

        const newBill = get().createBill(newBooking);

        console.log('[BookingStore] 创建预约:', newBooking.id, '账单:', newBill.id);
        return { booking: newBooking, bill: newBill };
      },

      cancelBooking: (bookingId) => {
        set((state) => ({
          bookings: state.bookings.map(b =>
            b.id === bookingId ? { ...b, status: 'cancelled' } : b
          ),
          bills: state.bills.map(b =>
            b.bookingId === bookingId ? { ...b, status: 'cancelled' } : b
          )
        }));

        const booking = get().bookings.find(b => b.id === bookingId);
        if (booking) {
          get().notifyNextWaitlist(booking.roomId, booking.date, booking.startTime, booking.endTime);
        }

        console.log('[BookingStore] 取消预约:', bookingId);
      },

      payBill: (billId) => {
        const state = get();
        const bill = state.bills.find(b => b.id === billId);
        if (!bill) return;

        set((s) => ({
          bills: s.bills.map(b =>
            b.id === billId ? { ...b, status: 'paid', paidAt: new Date().toISOString() } : b
          ),
          bookings: s.bookings.map(b =>
            b.id === bill.bookingId ? { ...b, status: 'confirmed' } : b
          )
        }));

        console.log('[BookingStore] 支付账单:', billId);
      },

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

      cancelWaitlist: (waitlistId) => {
        const item = get().waitlist.find(w => w.id === waitlistId);
        if (!item) return;

        set((state) => ({
          waitlist: state.waitlist.map(w =>
            w.id === waitlistId ? { ...w, status: 'cancelled' } : w
          )
        }));

        get().recalculateWaitlistPositions(item.roomId, item.date, item.startTime, item.endTime);
        console.log('[BookingStore] 取消候补:', waitlistId);
      },

      confirmWaitlist: (waitlistId) => {
        const state = get();
        const waitlistItem = state.waitlist.find(w => w.id === waitlistId);
        if (!waitlistItem || waitlistItem.status !== 'notified') {
          console.warn('[BookingStore] 候补状态不正确，无法确认:', waitlistId);
          return null;
        }

        const { totalAmount, breakdown } = calculateFee(waitlistItem.startTime, waitlistItem.endTime);

        const newBooking: Booking = {
          id: `bk-${Date.now()}`,
          roomId: waitlistItem.roomId,
          roomName: waitlistItem.roomName,
          userId: waitlistItem.userId,
          userName: waitlistItem.userName,
          date: waitlistItem.date,
          startTime: waitlistItem.startTime,
          endTime: waitlistItem.endTime,
          status: 'pending',
          totalPrice: totalAmount,
          feeBreakdown: breakdown,
          equipmentRentals: [],
          createdAt: new Date().toISOString(),
          timeoutAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        };

        set((s) => ({
          bookings: [newBooking, ...s.bookings],
          waitlist: s.waitlist.map(w =>
            w.id === waitlistId ? { ...w, status: 'confirmed' } : w
          )
        }));

        get().recalculateWaitlistPositions(waitlistItem.roomId, waitlistItem.date, waitlistItem.startTime, waitlistItem.endTime);

        const newBill = get().createBill(newBooking);

        console.log('[BookingStore] 候补确认补位:', waitlistId, '生成预约:', newBooking.id);
        return { booking: newBooking, bill: newBill };
      },

      declineWaitlist: (waitlistId) => {
        const item = get().waitlist.find(w => w.id === waitlistId);
        if (!item) return;

        set((state) => ({
          waitlist: state.waitlist.map(w =>
            w.id === waitlistId ? { ...w, status: 'expired' } : w
          )
        }));

        get().recalculateWaitlistPositions(item.roomId, item.date, item.startTime, item.endTime);
        get().notifyNextWaitlist(item.roomId, item.date, item.startTime, item.endTime);

        console.log('[BookingStore] 放弃候补，顺延下一位:', waitlistId);
      },

      recalculateWaitlistPositions: (roomId, date, startTime, endTime) => {
        set((state) => {
          const activeWaitlist = state.waitlist
            .filter(w => w.roomId === roomId && w.date === date && w.startTime === startTime && w.endTime === endTime && w.status === 'waiting')
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

          return {
            waitlist: state.waitlist.map(w => {
              if (w.roomId !== roomId || w.date !== date || w.startTime !== startTime || w.endTime !== endTime || w.status !== 'waiting') {
                return w;
              }
              const newPosition = activeWaitlist.findIndex(aw => aw.id === w.id) + 1;
              return { ...w, position: newPosition };
            })
          };
        });

        console.log('[BookingStore] 重新计算候补排名:', { roomId, date, startTime, endTime });
      },

      notifyNextWaitlist: (roomId, date, startTime, endTime) => {
        const state = get();
        const nextWaitlist = state.waitlist
          .filter(w => w.roomId === roomId && w.date === date && w.startTime === startTime && w.endTime === endTime && w.status === 'waiting')
          .sort((a, b) => a.position - b.position)[0];

        if (!nextWaitlist) {
          console.log('[BookingStore] 没有待通知的候补:', { roomId, date, startTime, endTime });
          return null;
        }

        set((s) => ({
          waitlist: s.waitlist.map(w =>
            w.id === nextWaitlist.id ? { ...w, status: 'notified', notifiedAt: new Date().toISOString() } : w
          )
        }));

        console.log('[BookingStore] 通知候补补位:', nextWaitlist.id, '用户:', nextWaitlist.userName);
        return nextWaitlist;
      },

      processTimeout: () => {
        const state = get();
        const now = new Date().getTime();

        state.bookings.forEach(booking => {
          if (booking.status === 'pending' && booking.timeoutAt) {
            const timeoutTime = new Date(booking.timeoutAt).getTime();
            if (now > timeoutTime) {
              console.log('[BookingStore] 预约超时，自动释放:', booking.id);

              set((s) => ({
                bookings: s.bookings.map(b =>
                  b.id === booking.id ? { ...b, status: 'timeout' } : b
                ),
                bills: s.bills.map(b =>
                  b.bookingId === booking.id ? { ...b, status: 'cancelled' } : b
                )
              }));

              get().notifyNextWaitlist(booking.roomId, booking.date, booking.startTime, booking.endTime);
            }
          }
        });

        state.waitlist.forEach(item => {
          if (item.status === 'notified' && item.notifiedAt) {
            const notifyTime = new Date(item.notifiedAt).getTime();
            const expireTime = notifyTime + 15 * 60 * 1000;
            if (now > expireTime) {
              console.log('[BookingStore] 候补通知超时，自动顺延:', item.id);
              get().declineWaitlist(item.id);
            }
          }
        });
      },

      startTimeoutChecker: () => {
        const state = get();
        if (state.timeoutChecker) {
          clearInterval(state.timeoutChecker);
        }

        const checker = setInterval(() => {
          get().processTimeout();
        }, 10000);

        set({ timeoutChecker: checker });
        console.log('[BookingStore] 启动超时检查器');
      },

      stopTimeoutChecker: () => {
        const state = get();
        if (state.timeoutChecker) {
          clearInterval(state.timeoutChecker);
          set({ timeoutChecker: null });
          console.log('[BookingStore] 停止超时检查器');
        }
      },

      getBookingsByUser: (userId) => get().bookings.filter(b => b.userId === userId),

      getWaitlistByUser: (userId) => get().waitlist.filter(w => w.userId === userId),

      getBillsByUser: (userId) => get().bills.filter(b => b.userId === userId),

      getBillByBookingId: (bookingId) => get().bills.find(b => b.bookingId === bookingId),

      getBookingById: (bookingId) => get().bookings.find(b => b.id === bookingId),

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
    }),
    {
      name: 'booking-storage',
      storage: createJSONStorage(() => taroStorage),
      partialize: (state) => ({
        bookings: state.bookings,
        waitlist: state.waitlist,
        bills: state.bills
      })
    }
  )
);
