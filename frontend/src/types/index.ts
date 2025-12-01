// Medicine types
export interface Medicine {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  frequency: string;
  timing: 'before_meal' | 'after_meal';
  times: string[];
  days: string[];
  confidence?: number;
  original_text?: string;
  warning?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface MedicineResult {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timing: string;
  times?: string[];
  confidence: number;
  original_text: string;
  status?: 'auto' | 'check' | 'review';
  warning?: string;
}

// Schedule types
export interface MedicineSchedule {
  id: string;
  medicine_id: string;
  time: string;
  status: 'pending' | 'completed' | 'missed';
  scheduled_date: string;
  taken_at?: string;
}

export interface DailySchedule {
  date: string;
  schedules: MedicineSchedule[];
}

// Alarm types
export interface AlarmSetting {
  id: string;
  medicine_id: string;
  medicine_name: string;
  time: string;
  enabled: boolean;
  days: string[];
  gradual_volume: boolean;
}

// Chat types
export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

// OCR Response types
export interface OCRResponse {
  success: boolean;
  medicines: MedicineResult[];
  warnings: DrugInteraction[];
  raw_text?: string;
}

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
}

// Chat Response types
export interface ChatResponse {
  success: boolean;
  message: string;
  suggestions?: string[];
}
