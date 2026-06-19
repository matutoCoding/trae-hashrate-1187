import { RateRule, FeeBreakdownItem, RateType } from '@/types';
import { timeToMinutes, minutesToTime } from './timeUtils';

const rateRules: RateRule[] = [
  {
    type: 'offpeak',
    name: '平峰时段',
    startTime: '09:00',
    endTime: '17:00',
    price: 80,
    color: '#00B42A'
  },
  {
    type: 'peak',
    name: '高峰时段',
    startTime: '17:00',
    endTime: '22:00',
    price: 120,
    color: '#FF7D00'
  },
  {
    type: 'night',
    name: '夜间时段',
    startTime: '22:00',
    endTime: '24:00',
    price: 100,
    color: '#7B61FF'
  }
];

export const getRateRules = (): RateRule[] => {
  return rateRules;
};

export const getRateTypeByTime = (time: string): RateType => {
  const minutes = timeToMinutes(time);
  for (const rule of rateRules) {
    const startMin = timeToMinutes(rule.startTime);
    const endMin = timeToMinutes(rule.endTime);
    if (minutes >= startMin && minutes < endMin) {
      return rule.type;
    }
  }
  return 'offpeak';
};

export const getRateInfo = (type: RateType): RateRule | undefined => {
  return rateRules.find(r => r.type === type);
};

export const getRatePrice = (type: RateType): number => {
  const rule = rateRules.find(r => r.type === type);
  return rule?.price || 0;
};

export interface FeeCalculationResult {
  totalAmount: number;
  breakdown: FeeBreakdownItem[];
}

export const calculateFee = (
  startTime: string,
  endTime: string
): FeeCalculationResult => {
  console.log('[FeeCalculator] 计算费用:', { startTime, endTime });

  const breakdown: FeeBreakdownItem[] = [];
  let totalAmount = 0;

  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  if (startMin >= endMin) {
    console.warn('[FeeCalculator] 结束时间早于开始时间');
    return { totalAmount: 0, breakdown: [] };
  }

  const sortedRules = [...rateRules].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );

  for (const rule of sortedRules) {
    const ruleStartMin = timeToMinutes(rule.startTime);
    const ruleEndMin = timeToMinutes(rule.endTime);

    const segmentStart = Math.max(startMin, ruleStartMin);
    const segmentEnd = Math.min(endMin, ruleEndMin);

    if (segmentStart < segmentEnd) {
      const durationMinutes = segmentEnd - segmentStart;
      const durationHours = durationMinutes / 60;
      const amount = Number((durationHours * rule.price).toFixed(2));

      breakdown.push({
        rateType: rule.type,
        rateName: rule.name,
        duration: durationMinutes,
        unitPrice: rule.price,
        amount,
        startTime: minutesToTime(segmentStart),
        endTime: minutesToTime(segmentEnd)
      });

      totalAmount += amount;
    }
  }

  console.log('[FeeCalculator] 计算结果:', { totalAmount, breakdownCount: breakdown.length });

  return {
    totalAmount: Number(totalAmount.toFixed(2)),
    breakdown
  };
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) {
    return `${mins}分钟`;
  }
  if (mins === 0) {
    return `${hours}小时`;
  }
  return `${hours}小时${mins}分钟`;
};

export const getRateColor = (type: RateType): string => {
  const rule = rateRules.find(r => r.type === type);
  return rule?.color || '#86909C';
};
