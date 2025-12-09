'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNavigation from '@/components/base/BottomNavigation';
import ActionCard from '@/components/base/ActionCard';
import { updateMedicine as updateMedicineApi, deleteMedicine as deleteMedicineApi } from '@/lib/supabase';
import { useMedicineStore } from '@/store/medicine';

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timing: string;
  times: string[];
  days?: string[];
}

// 복용 주기 옵션
const PERIOD_OPTIONS = [
  { value: 'daily', label: '일' },
  { value: 'weekly', label: '주' },
  { value: 'monthly', label: '월' },
];

// 복용 횟수 옵션
const FREQUENCY_COUNT_OPTIONS = [
  { value: 1, label: '1회' },
  { value: 2, label: '2회' },
  { value: 3, label: '3회' },
  { value: 4, label: '4회' },
];

// 주간 요일 옵션
const WEEKDAY_OPTIONS = [
  { value: 'mon', label: '월' },
  { value: 'tue', label: '화' },
  { value: 'wed', label: '수' },
  { value: 'thu', label: '목' },
  { value: 'fri', label: '금' },
  { value: 'sat', label: '토' },
  { value: 'sun', label: '일' },
];

// 월간 날짜 옵션 (1~31일)
const MONTHLY_DATE_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}일`,
}));

const DEFAULT_TIMES = ['08:00', '12:00', '18:00', '22:00'];

// 레거시 frequency 형식에서 파싱
const parseFrequency = (frequency: string): { period: string; count: number } => {
  if (frequency.includes('하루')) {
    const match = frequency.match(/(\d+)/);
    return { period: 'daily', count: match ? parseInt(match[1]) : 1 };
  }
  if (frequency.includes('주')) {
    const match = frequency.match(/(\d+)/);
    return { period: 'weekly', count: match ? parseInt(match[1]) : 1 };
  }
  if (frequency.includes('월')) {
    const match = frequency.match(/(\d+)/);
    return { period: 'monthly', count: match ? parseInt(match[1]) : 1 };
  }
  return { period: 'daily', count: 1 };
};

// 새 형식을 저장용 문자열로 변환
const formatFrequency = (period: string, count: number): string => {
  const periodLabel = period === 'daily' ? '하루' : period === 'weekly' ? '주' : '월';
  return `${periodLabel} ${count}회`;
};

// 용량에서 숫자 추출
const parseDosage = (dosage: string): number => {
  const match = dosage.match(/(\d+)/);
  return match ? parseInt(match[1]) : 1;
};

export default function MedicinePage() {
  const router = useRouter();
  const { medicines, isLoading, hasHydrated, fetchAll, invalidateCache } = useMedicineStore();

  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [deletingMedicine, setDeletingMedicine] = useState<Medicine | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 수정 모달용 추가 상태
  const [editDosageAmount, setEditDosageAmount] = useState<number>(1);
  const [editPeriod, setEditPeriod] = useState<string>('daily');
  const [editFrequencyCount, setEditFrequencyCount] = useState<number>(1);
  const [editSelectedDays, setEditSelectedDays] = useState<string[]>([]);
  const [editSelectedDates, setEditSelectedDates] = useState<number[]>([]);

  // Fetch medicines from store (cached) - hydration 완료 후에만
  useEffect(() => {
    if (hasHydrated) {
      fetchAll();
    }
  }, [hasHydrated, fetchAll]);

  const handleEditClick = (medicine: Medicine) => {
    setEditingMedicine({ ...medicine });
    // 기존 값으로 상태 초기화
    setEditDosageAmount(parseDosage(medicine.dosage));
    const parsed = parseFrequency(medicine.frequency);
    setEditPeriod(parsed.period);
    setEditFrequencyCount(parsed.count);
    setEditSelectedDays(medicine.days || []);
    setEditSelectedDates([]);
    setShowEditModal(true);
  };

  const handleDeleteClick = (medicine: Medicine) => {
    setDeletingMedicine(medicine);
    setShowDeleteModal(true);
  };

  const handleEditSave = async () => {
    if (!editingMedicine) return;

    // 사용자가 설정한 복용 시간 사용 (editingMedicine.times에 이미 반영됨)
    const times = editingMedicine.times;

    try {
      await updateMedicineApi(editingMedicine.id, {
        name: editingMedicine.name,
        dosage: `${editDosageAmount}정`,
        frequency: formatFrequency(editPeriod, editFrequencyCount),
        timing: editingMedicine.timing,
        times: times,
        days: editPeriod === 'weekly' ? editSelectedDays : undefined,
      });
      // 캐시 무효화 후 다시 fetch
      invalidateCache();
      await fetchAll();
      setShowEditModal(false);
      setEditingMedicine(null);
    } catch (error) {
      console.error('Failed to update medicine:', error);
      alert('약 정보 수정에 실패했습니다.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingMedicine) return;

    try {
      await deleteMedicineApi(deletingMedicine.id);
      // 캐시 무효화 후 다시 fetch
      invalidateCache();
      await fetchAll();
      setShowDeleteModal(false);
      setDeletingMedicine(null);
    } catch (error) {
      console.error('Failed to delete medicine:', error);
      alert('약 삭제에 실패했습니다.');
    }
  };

  // 복용 주기 변경 시
  const handlePeriodChange = (period: string) => {
    setEditPeriod(period);
    // 주기 변경 시 선택된 요일/날짜 초기화
    setEditSelectedDays([]);
    setEditSelectedDates([]);
    // 복용 시간도 횟수에 맞게 재설정
    if (editingMedicine) {
      const newTimes = DEFAULT_TIMES.slice(0, editFrequencyCount);
      setEditingMedicine({
        ...editingMedicine,
        times: newTimes,
      });
    }
  };

  // 복용 횟수 변경 시 복용 시간도 업데이트
  const handleFrequencyCountChange = (count: number) => {
    setEditFrequencyCount(count);
    if (editingMedicine) {
      const newTimes = DEFAULT_TIMES.slice(0, count);
      setEditingMedicine({
        ...editingMedicine,
        times: newTimes,
      });
    }
  };

  // 요일 토글
  const handleDayToggle = (day: string) => {
    setEditSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  // 날짜 토글
  const handleDateToggle = (date: number) => {
    setEditSelectedDates(prev =>
      prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
    );
  };

  const handleTimeChange = (index: number, time: string) => {
    if (!editingMedicine) return;

    const newTimes = [...editingMedicine.times];
    newTimes[index] = time;
    setEditingMedicine({
      ...editingMedicine,
      times: newTimes,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-6 pb-24 px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">약 관리</h1>
        {/* Add Medicine Actions */}
        <div className="space-y-4 mb-8">
          <ActionCard
            icon="📷"
            title="사진으로 추가하기"
            subtitle="약 포장지를 촬영해서 자동 인식"
            onClick={() => router.push('/medicine/prescription-capture')}
            color="blue"
          />

          <ActionCard
            icon="🔍"
            title="직접 검색하기"
            subtitle="약 이름을 입력해서 찾기"
            onClick={() => router.push('/medicine/search')}
            color="green"
          />
        </div>

        {/* Current Medicines */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">현재 복용 중인 약</h2>

          {!hasHydrated || isLoading ? (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">약 목록을 불러오는 중...</p>
            </div>
          ) : medicines.length === 0 ? (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
              <span className="text-4xl mb-4 block">💊</span>
              <p className="text-gray-600">등록된 약이 없습니다.</p>
              <p className="text-gray-500 text-sm mt-1">위 버튼을 눌러 약을 추가해보세요.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {medicines.map((medicine) => (
                <div
                  key={medicine.id}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {medicine.name}
                      </h3>
                      <div className="space-y-1">
                        <p className="text-base text-gray-600">
                          <span className="font-medium">용량:</span> {medicine.dosage}
                        </p>
                        <p className="text-base text-gray-600">
                          <span className="font-medium">복용 횟수:</span> {medicine.frequency}
                        </p>
                        <p className="text-base text-gray-600">
                          <span className="font-medium">복용 시기:</span>{' '}
                          {medicine.timing === 'before_meal' ? '식전' : medicine.timing === 'after_meal' ? '식후' : '상관없음'}
                        </p>
                        <p className="text-base text-gray-600">
                          <span className="font-medium">복용 시간:</span>{' '}
                          {medicine.times.join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() => handleEditClick(medicine)}
                        className="w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <i className="ri-edit-line text-lg"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(medicine)}
                        className="w-10 h-10 flex items-center justify-center bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <i className="ri-delete-bin-line text-lg"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />

      {/* Edit Modal */}
      {showEditModal && editingMedicine && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6">약 정보 수정</h3>

            <div className="space-y-5">
              {/* 약 이름 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  약 이름
                </label>
                <input
                  type="text"
                  value={editingMedicine.name}
                  onChange={(e) =>
                    setEditingMedicine({ ...editingMedicine, name: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="약 이름을 입력하세요"
                />
              </div>

              {/* 용량 - 숫자 입력 + 정 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  용량
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editDosageAmount}
                    onChange={(e) => setEditDosageAmount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center text-lg font-medium"
                  />
                  <span className="text-lg font-medium text-gray-700">정</span>
                </div>
              </div>

              {/* 복용 시기 - 식전, 식후, 상관없음 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  복용 시기
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      setEditingMedicine({ ...editingMedicine, timing: 'before_meal' })
                    }
                    className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                      editingMedicine.timing === 'before_meal'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    식전
                  </button>
                  <button
                    onClick={() =>
                      setEditingMedicine({ ...editingMedicine, timing: 'after_meal' })
                    }
                    className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                      editingMedicine.timing === 'after_meal'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    식후
                  </button>
                  <button
                    onClick={() =>
                      setEditingMedicine({ ...editingMedicine, timing: 'anytime' })
                    }
                    className={`px-3 py-3 rounded-xl font-medium transition-colors text-sm ${
                      editingMedicine.timing === 'anytime'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    상관없음
                  </button>
                </div>
              </div>

              {/* 복용 횟수 - 일/주/월 + 횟수 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  복용 횟수
                </label>
                {/* 주기 선택 (일/주/월) */}
                <div className="flex space-x-2 mb-3">
                  {PERIOD_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handlePeriodChange(option.value)}
                      className={`flex-1 py-2.5 rounded-xl font-medium transition-colors ${
                        editPeriod === option.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {/* 횟수 선택 */}
                <div className="flex space-x-2">
                  {FREQUENCY_COUNT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleFrequencyCountChange(option.value)}
                      className={`flex-1 py-2.5 rounded-xl font-medium transition-colors ${
                        editFrequencyCount === option.value
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {editPeriod === 'daily' && `매일 ${editFrequencyCount}회 복용`}
                  {editPeriod === 'weekly' && `매주 ${editFrequencyCount}회 복용`}
                  {editPeriod === 'monthly' && `매월 ${editFrequencyCount}회 복용`}
                </p>
              </div>

              {/* 주간 선택 시 요일 선택 */}
              {editPeriod === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    복용 요일
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAY_OPTIONS.map((day) => (
                      <button
                        key={day.value}
                        onClick={() => handleDayToggle(day.value)}
                        className={`w-10 h-10 rounded-full font-medium transition-colors ${
                          editSelectedDays.includes(day.value)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 월간 선택 시 날짜 선택 */}
              {editPeriod === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    복용 날짜
                  </label>
                  <div className="grid grid-cols-7 gap-1.5 max-h-40 overflow-y-auto">
                    {MONTHLY_DATE_OPTIONS.map((date) => (
                      <button
                        key={date.value}
                        onClick={() => handleDateToggle(date.value)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          editSelectedDates.includes(date.value)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {date.value}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 복용 시간 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  복용 시간
                </label>
                <div className="space-y-2">
                  {editingMedicine.times.map((time, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500 w-16">
                        {index + 1}회차
                      </span>
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => handleTimeChange(index, e.target.value)}
                        className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingMedicine(null);
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleEditSave}
                className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingMedicine && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center mb-6">
              <span className="text-5xl mb-4 block">🗑️</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">약 삭제</h3>
              <p className="text-gray-600">
                &apos;{deletingMedicine.name}&apos;을(를) 삭제하시겠습니까?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                삭제된 약은 복구할 수 없습니다.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingMedicine(null);
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
