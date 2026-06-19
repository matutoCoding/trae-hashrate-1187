import { create } from 'zustand';
import { UserInfo } from '@/types';

interface UserState {
  userInfo: UserInfo | null;
  setUserInfo: (user: UserInfo) => void;
  clearUserInfo: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  userInfo: {
    id: 'user-001',
    name: '张小明',
    phone: '138****8888',
    avatar: 'https://picsum.photos/id/64/200/200',
    balance: 520
  },
  setUserInfo: (user) => set({ userInfo: user }),
  clearUserInfo: () => set({ userInfo: null })
}));
