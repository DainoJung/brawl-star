import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database helper functions
export async function getMedicines(userId: string) {
  const { data, error } = await supabase
    .from('medicines')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function addMedicine(medicine: {
  user_id: string;
  name: string;
  dosage: string;
  frequency: string;
  timing: string;
  times: string[];
  days: string[];
  confidence?: number;
  original_text?: string;
  warning?: string;
  color?: string;
}) {
  const { data, error } = await supabase
    .from('medicines')
    .insert([medicine])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMedicine(id: string, updates: Partial<{
  name: string;
  dosage: string;
  frequency: string;
  timing: string;
  times: string[];
  days: string[];
}>) {
  const { data, error } = await supabase
    .from('medicines')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMedicine(id: string) {
  const { error } = await supabase
    .from('medicines')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getSchedules(userId: string, date: string) {
  const { data, error } = await supabase
    .from('schedules')
    .select(`
      *,
      medicines (*)
    `)
    .eq('user_id', userId)
    .eq('scheduled_date', date)
    .order('time', { ascending: true });

  if (error) throw error;
  return data;
}

export async function updateScheduleStatus(
  scheduleId: string,
  status: 'pending' | 'completed' | 'missed'
) {
  const { data, error } = await supabase
    .from('schedules')
    .update({
      status,
      taken_at: status === 'completed' ? new Date().toISOString() : null
    })
    .eq('id', scheduleId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAlarms(userId: string) {
  const { data, error } = await supabase
    .from('alarms')
    .select(`
      *,
      medicines (name)
    `)
    .eq('user_id', userId)
    .order('time', { ascending: true });

  if (error) throw error;
  return data;
}

export async function toggleAlarm(alarmId: string, enabled: boolean) {
  const { data, error } = await supabase
    .from('alarms')
    .update({ enabled })
    .eq('id', alarmId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAlarm(alarmId: string) {
  const { data, error } = await supabase
    .from('alarms')
    .select('*')
    .eq('id', alarmId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateAlarm(alarmId: string, updates: Partial<{
  medicine_name: string;
  time: string;
  enabled: boolean;
  days: string[];
  sound: string;
  vibration: boolean;
  gradual_volume: boolean;
  snooze_enabled: boolean;
  snooze_interval: number;
  snooze_count: number;
}>) {
  const { data, error } = await supabase
    .from('alarms')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', alarmId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAlarm(alarmId: string) {
  const { error } = await supabase
    .from('alarms')
    .delete()
    .eq('id', alarmId);

  if (error) throw error;
}

export async function createAlarm(alarm: {
  user_id: string;
  medicine_id?: string;
  medicine_name: string;
  time: string;
  enabled?: boolean;
  days?: string[];
  sound?: string;
  vibration?: boolean;
  gradual_volume?: boolean;
  snooze_enabled?: boolean;
  snooze_interval?: number;
  snooze_count?: number;
}) {
  const { data, error } = await supabase
    .from('alarms')
    .insert([alarm])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Chat messages
export async function getChatMessages(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function saveChatMessage(message: {
  user_id: string;
  message: string;
  is_user: boolean;
}) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert([message])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// User profile
export async function getOrCreateProfile(userId: string, name?: string) {
  // Try to get existing profile
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (existing) return existing;

  // Create new profile
  const { data, error } = await supabase
    .from('profiles')
    .insert([{ id: userId, name: name || '사용자' }])
    .select()
    .single();

  if (error) throw error;
  return data;
}
