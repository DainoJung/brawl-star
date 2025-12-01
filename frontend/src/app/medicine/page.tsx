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

const FREQUENCY_OPTIONS = [
  { value: '하루 1회', times: 1 },
  { value: '하루 2회', times: 2 },
  { value: '하루 3회', times: 3 },
  { value: '하루 4회', times: 4 },
];

const DEFAULT_TIMES = ['08:00', '12:00', '18:00', '22:00'];

export default function MedicinePage() {
  const router = useRouter();
  const { medicines, isLoading, fetchAll, invalidateCache } = useMedicineStore();

  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [deletingMedicine, setDeletingMedicine] = useState<Medicine | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch medicines from store (cached)
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleEditClick = (medicine: Medicine) => {
    setEditingMedicine({ ...medicine });
    setShowEditModal(true);
  };

  const handleDeleteClick = (medicine: Medicine) => {
    setDeletingMedicine(medicine);
    setShowDeleteModal(true);
  };

  const handleEditSave = async () => {
    if (!editingMedicine) return;

    try {
      await updateMedicineApi(editingMedicine.id, {
        name: editingMedicine.name,
        dosage: editingMedicine.dosage,
        frequency: editingMedicine.frequency,
        timing: editingMedicine.timing,
        times: editingMedicine.times,
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

  const handleFrequencyChange = (frequency: string) => {
    if (!editingMedicine) return;

    const freqOption = FREQUENCY_OPTIONS.find(f => f.value === frequency);
    const timesCount = freqOption?.times || 1;
    const newTimes = DEFAULT_TIMES.slice(0, timesCount);

    setEditingMedicine({
      ...editingMedicine,
      frequency,
      times: newTimes,
    });
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

          {isLoading ? (
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
                          {medicine.timing === 'before_meal' ? '식전' : '식후'}
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

              {/* 용량 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  용량
                </label>
                <input
                  type="text"
                  value={editingMedicine.dosage}
                  onChange={(e) =>
                    setEditingMedicine({ ...editingMedicine, dosage: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="예: 1정, 2캡슐"
                />
              </div>

              {/* 복용 횟수 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  복용 횟수
                </label>
                <select
                  value={editingMedicine.frequency}
                  onChange={(e) => handleFrequencyChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {FREQUENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value}
                    </option>
                  ))}
                </select>
              </div>

              {/* 복용 시기 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  복용 시기
                </label>
                <div className="flex space-x-3">
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
                </div>
              </div>

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
