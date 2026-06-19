import { WaitlistItem } from '@/types';
import dayjs from 'dayjs';

export const mockWaitlist: WaitlistItem[] = [
  {
    id: 'wl-001',
    roomId: 'room-001',
    roomName: '星空排练室 A',
    userId: 'user-001',
    userName: '张小明',
    date: dayjs().format('YYYY-MM-DD'),
    startTime: '20:00',
    endTime: '22:00',
    position: 1,
    status: 'waiting',
    createdAt: dayjs().subtract(2, 'hour').toISOString()
  },
  {
    id: 'wl-002',
    roomId: 'room-001',
    roomName: '星空排练室 A',
    userId: 'user-002',
    userName: '李小红',
    date: dayjs().format('YYYY-MM-DD'),
    startTime: '20:00',
    endTime: '22:00',
    position: 2,
    status: 'waiting',
    createdAt: dayjs().subtract(1, 'hour').toISOString()
  },
  {
    id: 'wl-003',
    roomId: 'room-002',
    roomName: '极光排练室 B',
    userId: 'user-001',
    userName: '张小明',
    date: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    startTime: '19:00',
    endTime: '21:00',
    position: 3,
    status: 'waiting',
    createdAt: dayjs().subtract(30, 'minute').toISOString()
  },
  {
    id: 'wl-004',
    roomId: 'room-005',
    roomName: '和声排练室 E',
    userId: 'user-001',
    userName: '张小明',
    date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
    startTime: '18:00',
    endTime: '20:00',
    position: 1,
    status: 'notified',
    createdAt: dayjs().subtract(2, 'day').toISOString(),
    notifiedAt: dayjs().subtract(15, 'minute').toISOString()
  },
  {
    id: 'wl-005',
    roomId: 'room-003',
    roomName: '回响排练室 C',
    userId: 'user-001',
    userName: '张小明',
    date: dayjs().subtract(2, 'day').format('YYYY-MM-DD'),
    startTime: '15:00',
    endTime: '17:00',
    position: 1,
    status: 'expired',
    createdAt: dayjs().subtract(3, 'day').toISOString()
  }
];

export const getWaitlistByUser = (userId: string): WaitlistItem[] => {
  return mockWaitlist.filter(w => w.userId === userId);
};

export const getWaitlistByRoomAndDate = (
  roomId: string,
  date: string
): WaitlistItem[] => {
  return mockWaitlist.filter(w => w.roomId === roomId && w.date === date);
};

export const getWaitlistById = (id: string): WaitlistItem | undefined => {
  return mockWaitlist.find(w => w.id === id);
};
