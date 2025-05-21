export type ScheduleType = 'one_time' | 'daily' | 'weekly' | 'monthly';

export interface ScheduledAlert {
  id: string;
  trackerId: string;
  title: string;
  message: string;
  scheduleType: ScheduleType;
  scheduledTime?: string; // HH:MM format
  scheduledDate?: string; // YYYY-MM-DD format
  dayOfWeek?: number; // 0-6 for Sunday-Saturday
  dayOfMonth?: number; // 1-31
  isActive: boolean;
  lastTriggered?: string;
  createdAt: string;
  updatedAt: string;
}
