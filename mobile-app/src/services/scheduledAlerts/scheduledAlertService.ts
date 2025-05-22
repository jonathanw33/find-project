import { supabase } from '../supabase';

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

export interface CreateScheduledAlertParams {
  trackerId: string;
  title: string;
  message: string;
  scheduleType: ScheduleType;
  scheduledTime?: string;
  scheduledDate?: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  isActive?: boolean;
}

export interface UpdateScheduledAlertParams {
  title?: string;
  message?: string;
  scheduleType?: ScheduleType;
  scheduledTime?: string;
  scheduledDate?: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  isActive?: boolean;
}

export const scheduledAlertService = {
  async getScheduledAlerts(trackerId?: string): Promise<ScheduledAlert[]> {
    // Get the current user ID for security
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData.session?.user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    let query = supabase
      .from('scheduled_alerts')
      .select('*')
      .eq('user_id', userId) // Only get alerts for the current user
      .order('created_at', { ascending: false });
      
    if (trackerId) {
      query = query.eq('tracker_id', trackerId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return (data || []).map(item => ({
      id: item.id,
      trackerId: item.tracker_id,
      title: item.title,
      message: item.message,
      scheduleType: item.schedule_type,
      scheduledTime: item.scheduled_time,
      scheduledDate: item.scheduled_date,
      dayOfWeek: item.day_of_week,
      dayOfMonth: item.day_of_month,
      isActive: item.is_active,
      lastTriggered: item.last_triggered,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  },
  
  async getScheduledAlert(id: string): Promise<ScheduledAlert> {
    // Get the current user ID for security
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData.session?.user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('scheduled_alerts')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId) // Only allow access to user's own alerts
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      trackerId: data.tracker_id,
      title: data.title,
      message: data.message,
      scheduleType: data.schedule_type,
      scheduledTime: data.scheduled_time,
      scheduledDate: data.scheduled_date,
      dayOfWeek: data.day_of_week,
      dayOfMonth: data.day_of_month,
      isActive: data.is_active,
      lastTriggered: data.last_triggered,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },
  
  async createScheduledAlert(params: CreateScheduledAlertParams): Promise<ScheduledAlert> {
    // Get the current user ID
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData.session?.user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('scheduled_alerts')
      .insert({
        user_id: userId,
        tracker_id: params.trackerId,
        title: params.title,
        message: params.message,
        schedule_type: params.scheduleType,
        scheduled_time: params.scheduledTime,
        scheduled_date: params.scheduledDate,
        day_of_week: params.dayOfWeek,
        day_of_month: params.dayOfMonth,
        is_active: params.isActive !== undefined ? params.isActive : true,
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      trackerId: data.tracker_id,
      title: data.title,
      message: data.message,
      scheduleType: data.schedule_type,
      scheduledTime: data.scheduled_time,
      scheduledDate: data.scheduled_date,
      dayOfWeek: data.day_of_week,
      dayOfMonth: data.day_of_month,
      isActive: data.is_active,
      lastTriggered: data.last_triggered,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },
  
  async updateScheduledAlert(id: string, params: UpdateScheduledAlertParams): Promise<ScheduledAlert> {
    // Get the current user ID for security
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData.session?.user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    const updates: any = {};
    
    if (params.title !== undefined) updates.title = params.title;
    if (params.message !== undefined) updates.message = params.message;
    if (params.scheduleType !== undefined) updates.schedule_type = params.scheduleType;
    if (params.scheduledTime !== undefined) updates.scheduled_time = params.scheduledTime;
    if (params.scheduledDate !== undefined) updates.scheduled_date = params.scheduledDate;
    if (params.dayOfWeek !== undefined) updates.day_of_week = params.dayOfWeek;
    if (params.dayOfMonth !== undefined) updates.day_of_month = params.dayOfMonth;
    if (params.isActive !== undefined) updates.is_active = params.isActive;
    
    const { data, error } = await supabase
      .from('scheduled_alerts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId) // Only allow updating user's own alerts
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      trackerId: data.tracker_id,
      title: data.title,
      message: data.message,
      scheduleType: data.schedule_type,
      scheduledTime: data.scheduled_time,
      scheduledDate: data.scheduled_date,
      dayOfWeek: data.day_of_week,
      dayOfMonth: data.day_of_month,
      isActive: data.is_active,
      lastTriggered: data.last_triggered,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },
  
  async deleteScheduledAlert(id: string): Promise<void> {
    // Get the current user ID for security
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData.session?.user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    const { error } = await supabase
      .from('scheduled_alerts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // Only allow deleting user's own alerts
      
    if (error) throw error;
  },
};
