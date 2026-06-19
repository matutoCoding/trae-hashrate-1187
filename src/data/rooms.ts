import { Room } from '@/types';

export const mockRooms: Room[] = [
  {
    id: 'room-001',
    name: '星空排练室 A',
    description: '大型排练室，配备专业音响设备',
    capacity: 10,
    equipments: ['电吉他', '贝斯', '架子鼓', '键盘', '专业音响'],
    location: '1楼 101室',
    imageUrl: 'https://picsum.photos/id/3/750/500',
    basePrice: 100,
    status: 'available'
  },
  {
    id: 'room-002',
    name: '极光排练室 B',
    description: '中型排练室，适合乐队排练',
    capacity: 6,
    equipments: ['吉他音箱', '贝斯音箱', '电子鼓', '麦克风套装'],
    location: '1楼 102室',
    imageUrl: 'https://picsum.photos/id/1/750/500',
    basePrice: 80,
    status: 'available'
  },
  {
    id: 'room-003',
    name: '回响排练室 C',
    description: '小型排练室，适合个人练习',
    capacity: 4,
    equipments: ['吉他音箱', '麦克风', '耳机分配器'],
    location: '2楼 201室',
    imageUrl: 'https://picsum.photos/id/201/750/500',
    basePrice: 60,
    status: 'available'
  },
  {
    id: 'room-004',
    name: '律动排练室 D',
    description: '专业鼓房，隔音效果极佳',
    capacity: 5,
    equipments: ['架子鼓', '镲片套装', '贝斯音箱', '吉他音箱'],
    location: '2楼 202室',
    imageUrl: 'https://picsum.photos/id/119/750/500',
    basePrice: 90,
    status: 'maintenance'
  },
  {
    id: 'room-005',
    name: '和声排练室 E',
    description: '多功能排练室，适合声乐练习',
    capacity: 8,
    equipments: ['专业麦克风', '监听音响', '钢琴', '效果器'],
    location: '3楼 301室',
    imageUrl: 'https://picsum.photos/id/160/750/500',
    basePrice: 110,
    status: 'available'
  },
  {
    id: 'room-006',
    name: '弦乐排练室 F',
    description: '大型综合排练室',
    capacity: 12,
    equipments: ['全套乐队设备', '专业音响系统', '灯光系统', '录音设备'],
    location: '3楼 302室',
    imageUrl: 'https://picsum.photos/id/9/750/500',
    basePrice: 150,
    status: 'available'
  }
];

export const getRoomById = (id: string): Room | undefined => {
  return mockRooms.find(room => room.id === id);
};

export const getAvailableRooms = (): Room[] => {
  return mockRooms.filter(room => room.status === 'available');
};
