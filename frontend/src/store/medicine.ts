import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Medicine, MedicineResult, MedicineSchedule, AlarmSetting } from '@/types';
import { getMedicines, getAlarms } from '@/lib/supabase';

const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001';

interface MedicineState {
  // Current medicines
  medicines: Medicine[];
  setMedicines: (medicines: Medicine[]) => void;
  addMedicine: (medicine: Medicine) => void;
  updateMedicine: (id: string, updates: Partial<Medicine>) => void;
  removeMedicine: (id: string) => void;

  // OCR results (temporary)
  ocrResults: MedicineResult[];
  setOcrResults: (results: MedicineResult[]) => void;
  updateOcrResult: (id: string, updates: Partial<MedicineResult>) => void;
  removeOcrResult: (id: string) => void;
  clearOcrResults: () => void;

  // Schedules
  todaySchedules: MedicineSchedule[];
  setTodaySchedules: (schedules: MedicineSchedule[]) => void;
  updateScheduleStatus: (id: string, status: 'pending' | 'completed' | 'missed') => void;

  // Alarms
  alarms: AlarmSetting[];
  setAlarms: (alarms: AlarmSetting[]) => void;
  toggleAlarm: (id: string) => void;

  // User
  userName: string;
  setUserName: (name: string) => void;

  // Data fetching & caching
  isLoading: boolean;
  lastFetchedAt: number | null;
  fetchMedicines: () => Promise<void>;
  fetchAlarms: () => Promise<void>;
  fetchAll: () => Promise<void>;
  invalidateCache: () => void;
}

export const useMedicineStore = create<MedicineState>()(
  persist(
    (set, get) => ({
      // Medicines
      medicines: [],
      setMedicines: (medicines) => set({ medicines }),
      addMedicine: (medicine) =>
        set((state) => ({ medicines: [...state.medicines, medicine] })),
      updateMedicine: (id, updates) =>
        set((state) => ({
          medicines: state.medicines.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),
      removeMedicine: (id) =>
        set((state) => ({
          medicines: state.medicines.filter((m) => m.id !== id),
        })),

      // OCR Results
      ocrResults: [],
      setOcrResults: (results) => set({ ocrResults: results }),
      updateOcrResult: (id, updates) =>
        set((state) => ({
          ocrResults: state.ocrResults.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),
      removeOcrResult: (id) =>
        set((state) => ({
          ocrResults: state.ocrResults.filter((r) => r.id !== id),
        })),
      clearOcrResults: () => set({ ocrResults: [] }),

      // Schedules
      todaySchedules: [],
      setTodaySchedules: (schedules) => set({ todaySchedules: schedules }),
      updateScheduleStatus: (id, status) =>
        set((state) => ({
          todaySchedules: state.todaySchedules.map((s) =>
            s.id === id ? { ...s, status } : s
          ),
        })),

      // Alarms
      alarms: [],
      setAlarms: (alarms) => set({ alarms }),
      toggleAlarm: (id) =>
        set((state) => ({
          alarms: state.alarms.map((a) =>
            a.id === id ? { ...a, enabled: !a.enabled } : a
          ),
        })),

      // User
      userName: '김할머니',
      setUserName: (name) => set({ userName: name }),

      // Data fetching & caching
      isLoading: false,
      lastFetchedAt: null,

      fetchMedicines: async () => {
        try {
          const data = await getMedicines(TEMP_USER_ID);
          if (data) {
            set({ medicines: data });
          }
        } catch (error) {
          console.error('Failed to fetch medicines:', error);
        }
      },

      fetchAlarms: async () => {
        try {
          const data = await getAlarms(TEMP_USER_ID);
          if (data) {
            set({ alarms: data });
          }
        } catch (error) {
          console.error('Failed to fetch alarms:', error);
        }
      },

      fetchAll: async () => {
        const { lastFetchedAt, isLoading } = get();
        const now = Date.now();

        // 이미 로딩 중이면 스킵
        if (isLoading) return;

        // 5분 이내에 fetch했으면 캐시 사용
        if (lastFetchedAt && now - lastFetchedAt < 5 * 60 * 1000) {
          return;
        }

        set({ isLoading: true });
        try {
          const [medicines, alarms] = await Promise.all([
            getMedicines(TEMP_USER_ID),
            getAlarms(TEMP_USER_ID),
          ]);

          set({
            medicines: medicines || [],
            alarms: alarms || [],
            lastFetchedAt: now,
          });
        } catch (error) {
          console.error('Failed to fetch data:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      invalidateCache: () => {
        set({ lastFetchedAt: null });
      },
    }),
    {
      name: 'medicine-storage',
      partialize: (state) => ({
        medicines: state.medicines,
        alarms: state.alarms,
        userName: state.userName,
        lastFetchedAt: state.lastFetchedAt,
      }),
    }
  )
);
