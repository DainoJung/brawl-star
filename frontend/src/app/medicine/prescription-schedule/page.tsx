'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopHeader from '@/components/base/TopHeader';
import { useMedicineStore } from '@/store/medicine';
import { addMedicine, createAlarm } from '@/lib/supabase';

const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001';

interface MedicineSchedule {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timing: string;
  times: string[];
  color: string;
  warning?: string;
}

const COLORS = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];

export default function PrescriptionSchedulePage() {
  const router = useRouter();
  const { ocrResults, clearOcrResults, invalidateCache } = useMedicineStore();
  const [medicines, setMedicines] = useState<MedicineSchedule[]>([]);
  const [saving, setSaving] = useState(false);

  // Initialize from store
  useEffect(() => {
    if (ocrResults && ocrResults.length > 0) {
      const transformed = ocrResults.map((result, index) => ({
        id: result.id || String(index + 1),
        name: result.name,
        dosage: result.dosage,
        frequency: result.frequency,
        timing: result.timing,
        times: result.times || ['08:00'],
        color: COLORS[index % COLORS.length],
        warning: result.warning,
      }));
      setMedicines(transformed);
    } else {
      router.push('/medicine/prescription-capture');
    }
  }, [ocrResults, router]);

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<string | null>(null);
  const [selectedTimeIndex, setSelectedTimeIndex] = useState<number>(0);

  const handleTimeChange = (medicineId: string, timeIndex: number) => {
    setSelectedMedicine(medicineId);
    setSelectedTimeIndex(timeIndex);
    setShowTimePicker(true);
  };

  const handleSaveTime = (newTime: string) => {
    if (selectedMedicine) {
      setMedicines(medicines.map(m => {
        if (m.id === selectedMedicine) {
          const newTimes = [...m.times];
          newTimes[selectedTimeIndex] = newTime;
          return { ...m, times: newTimes };
        }
        return m;
      }));
    }
    setShowTimePicker(false);
  };

  const handleRegisterAlarms = async () => {
    setSaving(true);
    try {
      // Save each medicine to Supabase and create alarms
      for (const medicine of medicines) {
        // Save medicine
        const savedMedicine = await addMedicine({
          user_id: TEMP_USER_ID,
          name: medicine.name,
          dosage: medicine.dosage,
          frequency: medicine.frequency,
          timing: medicine.timing,
          times: medicine.times,
          days: ['월', '화', '수', '목', '금', '토', '일'],
          warning: medicine.warning,
          color: medicine.color,
        });

        // Create alarms for each time
        for (const time of medicine.times) {
          await createAlarm({
            user_id: TEMP_USER_ID,
            medicine_id: savedMedicine.id,
            medicine_name: medicine.name,
            time: time,
            enabled: true,
            days: ['월', '화', '수', '목', '금', '토', '일'],
          });
        }
      }

      // Clear OCR results and invalidate cache
      clearOcrResults();
      invalidateCache();
      router.push('/medicine/prescription-complete');
    } catch (error) {
      console.error('Failed to save medicines:', error);
      alert('약 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader
        title="복용 시간 설정"
        showBack
        onBack={() => router.push('/medicine/prescription-result')}
      />

      <div className="pt-20 pb-32 px-5">
        {/* 안내 메시지 */}
        <div className="bg-blue-50 rounded-xl p-5 mb-6">
          <div className="flex items-start space-x-3">
            <i className="ri-time-line text-xl text-blue-600 flex-shrink-0 mt-0.5"></i>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                복용 시간 자동 추천
              </h3>
              <p className="text-base text-gray-700 leading-relaxed">
                처방전 정보를 바탕으로<br />
                최적의 복용 시간을 추천해드려요
              </p>
            </div>
          </div>
        </div>

        {/* 약별 스케줄 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">약별 복용 시간</h3>
          <div className="space-y-4">
            {medicines.map((medicine) => (
              <div
                key={medicine.id}
                className="bg-white rounded-2xl p-5 shadow-sm border-2 border-gray-100"
              >
                {/* 약 정보 */}
                <div className="flex items-start space-x-3 mb-4">
                  <div className={`w-12 h-12 ${medicine.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <i className="ri-capsule-line text-2xl text-white"></i>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900 mb-1">
                      {medicine.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {medicine.dosage} · {medicine.times.length}회
                    </p>
                  </div>
                </div>

                {/* 시간 칩 */}
                <div className="flex flex-wrap gap-2">
                  {medicine.times.map((time, index) => (
                    <button
                      key={index}
                      onClick={() => handleTimeChange(medicine.id, index)}
                      className="px-5 py-3 bg-blue-50 border-2 border-blue-300 text-blue-700 rounded-full font-semibold text-base hover:bg-blue-100 active:scale-95 transition-all flex items-center space-x-2"
                    >
                      <i className="ri-time-line text-lg"></i>
                      <span>{time}</span>
                      <i className="ri-arrow-down-s-line text-lg"></i>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 시간대별 요약 */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <i className="ri-calendar-check-line text-xl text-blue-600"></i>
            <span>시간대별 복용 약</span>
          </h3>
          <div className="space-y-3">
            {['08:00', '14:00', '20:00'].map((time) => {
              const medsAtTime = medicines.filter(m => m.times.includes(time));
              if (medsAtTime.length === 0) return null;

              return (
                <div key={time} className="bg-white rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-gray-900">{time}</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                      {medsAtTime.length}개
                    </span>
                  </div>
                  <div className="space-y-1">
                    {medsAtTime.map((med) => (
                      <div key={med.id} className="flex items-center space-x-2">
                        <div className={`w-3 h-3 ${med.color} rounded-full`}></div>
                        <span className="text-sm text-gray-700">{med.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-5 shadow-lg">
        <button
          onClick={handleRegisterAlarms}
          disabled={saving || medicines.length === 0}
          className="w-full h-20 bg-blue-600 text-white rounded-2xl font-bold text-xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg disabled:bg-blue-300"
        >
          {saving ? '등록 중...' : '알람 등록하기'}
        </button>
      </div>

      {/* 시간 선택 모달 */}
      {showTimePicker && (
        <TimePickerModal
          initialTime={medicines.find(m => m.id === selectedMedicine)?.times[selectedTimeIndex] || '08:00'}
          onClose={() => setShowTimePicker(false)}
          onSave={handleSaveTime}
        />
      )}
    </div>
  );
}

// 시간 선택 모달
interface TimePickerModalProps {
  initialTime: string;
  onClose: () => void;
  onSave: (time: string) => void;
}

function TimePickerModal({ initialTime, onClose, onSave }: TimePickerModalProps) {
  const [hour, setHour] = useState(parseInt(initialTime.split(':')[0]));
  const [minute, setMinute] = useState(parseInt(initialTime.split(':')[1]));

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleSave = () => {
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    onSave(timeString);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-3xl">
        {/* 헤더 */}
        <div className="border-b-2 border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">시간 선택</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200"
            >
              <i className="ri-close-line text-2xl text-gray-600"></i>
            </button>
          </div>
        </div>

        <div className="p-5">
          {/* 시간 선택기 */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            {/* 시 */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">시</label>
              <select
                value={hour}
                onChange={(e) => setHour(parseInt(e.target.value))}
                className="w-full h-16 text-2xl font-bold text-center border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              >
                {hours.map((h) => (
                  <option key={h} value={h}>
                    {h.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-3xl font-bold text-gray-400 mt-8">:</span>

            {/* 분 */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">분</label>
              <select
                value={minute}
                onChange={(e) => setMinute(parseInt(e.target.value))}
                className="w-full h-16 text-2xl font-bold text-center border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              >
                {minutes.map((m) => (
                  <option key={m} value={m}>
                    {m.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 빠른 선택 */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">빠른 선택</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '아침', time: '08:00' },
                { label: '점심', time: '12:00' },
                { label: '저녁', time: '18:00' },
                { label: '취침', time: '22:00' },
              ].map((preset) => (
                <button
                  key={preset.time}
                  onClick={() => {
                    const [h, m] = preset.time.split(':').map(Number);
                    setHour(h);
                    setMinute(m);
                  }}
                  className="py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-blue-100 hover:text-blue-700 active:scale-95 transition-all"
                >
                  {preset.label}<br />{preset.time}
                </button>
              ))}
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 h-16 bg-gray-200 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-300 active:scale-[0.98] transition-all"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="flex-1 h-16 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 active:scale-[0.98] transition-all"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
