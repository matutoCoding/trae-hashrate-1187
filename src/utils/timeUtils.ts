import dayjs from 'dayjs';

export const formatTime = (time: string): string => {
  return time;
};

export const formatDate = (date: string | Date, format = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date, format = 'YYYY-MM-DD HH:mm'): string => {
  return dayjs(date).format(format);
};

export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const getDurationMinutes = (startTime: string, endTime: string): number => {
  return timeToMinutes(endTime) - timeToMinutes(startTime);
};

export const getDurationHours = (startTime: string, endTime: string): number => {
  return getDurationMinutes(startTime, endTime) / 60;
};

export const generateDateList = (days: number): string[] => {
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    dates.push(dayjs().add(i, 'day').format('YYYY-MM-DD'));
  }
  return dates;
};

export const getDayOfWeek = (date: string): string => {
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return dayNames[dayjs(date).day()];
};

export const isToday = (date: string): boolean => {
  return dayjs(date).isSame(dayjs(), 'day');
};

export const generateTimeSlots = (
  startHour: number,
  endHour: number,
  interval: number
): { startTime: string; endTime: string }[] => {
  const slots: { startTime: string; endTime: string }[] = [];
  let current = startHour * 60;
  const end = endHour * 60;

  while (current + interval <= end) {
    slots.push({
      startTime: minutesToTime(current),
      endTime: minutesToTime(current + interval)
    });
    current += interval;
  }

  return slots;
};
