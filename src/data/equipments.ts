import { Equipment } from '@/types';

export const mockEquipments: Equipment[] = [
  {
    id: 'eq-001',
    name: '电吉他',
    category: '弦乐器',
    price: 30,
    unit: '次',
    imageUrl: 'https://picsum.photos/id/1/200/200',
    available: 5
  },
  {
    id: 'eq-002',
    name: '贝斯吉他',
    category: '弦乐器',
    price: 35,
    unit: '次',
    imageUrl: 'https://picsum.photos/id/2/200/200',
    available: 3
  },
  {
    id: 'eq-003',
    name: '电子鼓套件',
    category: '打击乐器',
    price: 50,
    unit: '次',
    imageUrl: 'https://picsum.photos/id/3/200/200',
    available: 2
  },
  {
    id: 'eq-004',
    name: '合成器键盘',
    category: '键盘乐器',
    price: 40,
    unit: '次',
    imageUrl: 'https://picsum.photos/id/6/200/200',
    available: 4
  },
  {
    id: 'eq-005',
    name: '专业麦克风',
    category: '音响设备',
    price: 20,
    unit: '支',
    imageUrl: 'https://picsum.photos/id/8/200/200',
    available: 10
  },
  {
    id: 'eq-006',
    name: '监听耳机',
    category: '音响设备',
    price: 15,
    unit: '副',
    imageUrl: 'https://picsum.photos/id/9/200/200',
    available: 8
  },
  {
    id: 'eq-007',
    name: '效果器踏板',
    category: '音响设备',
    price: 25,
    unit: '套',
    imageUrl: 'https://picsum.photos/id/119/200/200',
    available: 3
  },
  {
    id: 'eq-008',
    name: '功放音箱',
    category: '音响设备',
    price: 60,
    unit: '套',
    imageUrl: 'https://picsum.photos/id/160/200/200',
    available: 2
  }
];

export const getEquipmentById = (id: string): Equipment | undefined => {
  return mockEquipments.find(eq => eq.id === id);
};

export const getEquipmentsByCategory = (category: string): Equipment[] => {
  return mockEquipments.filter(eq => eq.category === category);
};
