'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TopHeader from '@/components/base/TopHeader';
import { addMedicine } from '@/lib/supabase';
import { useMedicineStore } from '@/store/medicine';

const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001';

interface MedicineInfo {
  id: string;
  name: string;
  company: string;
  category: string;
  description: string;
  dosageForm: string;
  defaultDosage: string;
  defaultFrequency: string;
}

// 약물 데이터베이스 (실제 구현에서는 API 호출)
const MEDICINE_DATABASE: MedicineInfo[] = [
  {
    id: 'm1',
    name: '타이레놀 500mg',
    company: '한국존슨앤드존슨',
    category: '해열진통제',
    description: '두통, 치통, 생리통, 근육통 등의 통증 완화 및 해열',
    dosageForm: '정제',
    defaultDosage: '1정',
    defaultFrequency: '하루 3회',
  },
  {
    id: 'm2',
    name: '아스피린 프로텍트 100mg',
    company: '바이엘코리아',
    category: '해열진통제/혈전예방',
    description: '심혈관 질환 예방, 혈전 생성 억제',
    dosageForm: '정제',
    defaultDosage: '1정',
    defaultFrequency: '하루 1회',
  },
  {
    id: 'm3',
    name: '암로디핀 5mg',
    company: '한미약품',
    category: '고혈압치료제',
    description: '고혈압 치료, 혈압 강하',
    dosageForm: '정제',
    defaultDosage: '1정',
    defaultFrequency: '하루 1회',
  },
  {
    id: 'm4',
    name: '메트포르민 500mg',
    company: '대웅제약',
    category: '당뇨병치료제',
    description: '제2형 당뇨병 치료, 혈당 조절',
    dosageForm: '정제',
    defaultDosage: '1정',
    defaultFrequency: '하루 2회',
  },
  {
    id: 'm5',
    name: '오메프라졸 20mg',
    company: '유한양행',
    category: '위장약',
    description: '위산 분비 억제, 위궤양 및 역류성 식도염 치료',
    dosageForm: '캡슐',
    defaultDosage: '1캡슐',
    defaultFrequency: '하루 1회',
  },
  {
    id: 'm6',
    name: '판크레아틴',
    company: '보령제약',
    category: '소화제',
    description: '소화불량, 식욕부진, 과식 후 소화 촉진',
    dosageForm: '정제',
    defaultDosage: '1정',
    defaultFrequency: '하루 3회',
  },
  {
    id: 'm7',
    name: '로사르탄 50mg',
    company: '동아에스티',
    category: '고혈압치료제',
    description: '고혈압 치료, 심혈관 보호',
    dosageForm: '정제',
    defaultDosage: '1정',
    defaultFrequency: '하루 1회',
  },
  {
    id: 'm8',
    name: '아토르바스타틴 10mg',
    company: '화이자',
    category: '고지혈증치료제',
    description: '콜레스테롤 수치 조절, 고지혈증 치료',
    dosageForm: '정제',
    defaultDosage: '1정',
    defaultFrequency: '하루 1회',
  },
  {
    id: 'm9',
    name: '레보세티리진 5mg',
    company: '종근당',
    category: '알레르기치료제',
    description: '알레르기 비염, 두드러기, 피부 가려움 치료',
    dosageForm: '정제',
    defaultDosage: '1정',
    defaultFrequency: '하루 1회',
  },
  {
    id: 'm10',
    name: '이부프로펜 200mg',
    company: '삼성제약',
    category: '해열진통제',
    description: '두통, 치통, 근육통, 관절통 완화 및 해열',
    dosageForm: '정제',
    defaultDosage: '1정',
    defaultFrequency: '하루 3회',
  },
  {
    id: 'm11',
    name: '비타민D 1000IU',
    company: '일동제약',
    category: '비타민제',
    description: '비타민D 결핍 예방 및 치료, 뼈 건강',
    dosageForm: '캡슐',
    defaultDosage: '1캡슐',
    defaultFrequency: '하루 1회',
  },
  {
    id: 'm12',
    name: '오메가3 1000mg',
    company: '광동제약',
    category: '영양제',
    description: '혈중 중성지방 개선, 혈행 개선',
    dosageForm: '캡슐',
    defaultDosage: '1캡슐',
    defaultFrequency: '하루 2회',
  },
];

interface AddMedicineForm {
  name: string;
  dosage: string;
  frequency: string;
  beforeMeal: boolean;
  times: string[];
}

const FREQUENCY_OPTIONS = [
  { value: '하루 1회', times: 1 },
  { value: '하루 2회', times: 2 },
  { value: '하루 3회', times: 3 },
  { value: '하루 4회', times: 4 },
];

const DEFAULT_TIMES = ['08:00', '12:00', '18:00', '22:00'];

export default function MedicineSearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MedicineInfo[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    '타이레놀', '혈압약', '당뇨약', '소화제'
  ]);
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineInfo | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<AddMedicineForm>({
    name: '',
    dosage: '',
    frequency: '하루 1회',
    beforeMeal: false,
    times: ['08:00'],
  });

  const handleSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results = MEDICINE_DATABASE.filter(
      (medicine) =>
        medicine.name.toLowerCase().includes(query.toLowerCase()) ||
        medicine.category.toLowerCase().includes(query.toLowerCase()) ||
        medicine.company.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, handleSearch]);

  const handleRecentSearchClick = (term: string) => {
    setSearchQuery(term);
    handleSearch(term);
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
  };

  const handleMedicineSelect = (medicine: MedicineInfo) => {
    setSelectedMedicine(medicine);
    setAddForm({
      name: medicine.name,
      dosage: medicine.defaultDosage,
      frequency: medicine.defaultFrequency,
      beforeMeal: false,
      times: DEFAULT_TIMES.slice(
        0,
        FREQUENCY_OPTIONS.find((f) => f.value === medicine.defaultFrequency)?.times || 1
      ),
    });
    setShowAddModal(true);

    // 최근 검색어에 추가
    if (!recentSearches.includes(medicine.name)) {
      setRecentSearches((prev) => [medicine.name, ...prev.slice(0, 4)]);
    }
  };

  const handleFrequencyChange = (frequency: string) => {
    const freqOption = FREQUENCY_OPTIONS.find((f) => f.value === frequency);
    const timesCount = freqOption?.times || 1;
    setAddForm({
      ...addForm,
      frequency,
      times: DEFAULT_TIMES.slice(0, timesCount),
    });
  };

  const handleTimeChange = (index: number, time: string) => {
    const newTimes = [...addForm.times];
    newTimes[index] = time;
    setAddForm({ ...addForm, times: newTimes });
  };

  const { invalidateCache } = useMedicineStore();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddMedicine = async () => {
    if (isAdding) return;

    setIsAdding(true);
    try {
      await addMedicine({
        user_id: TEMP_USER_ID,
        name: addForm.name,
        dosage: addForm.dosage,
        frequency: addForm.frequency,
        timing: addForm.beforeMeal ? 'before_meal' : 'after_meal',
        times: addForm.times,
        days: ['월', '화', '수', '목', '금', '토', '일'],
      });

      // 캐시 무효화하여 medicine 페이지에서 새로운 데이터를 가져오도록 함
      invalidateCache();

      setShowAddModal(false);
      setSelectedMedicine(null);
      router.push('/medicine');
    } catch (error) {
      console.error('Failed to add medicine:', error);
      alert('약 추가에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader
        title="약 검색"
        showBack
        onBack={() => router.push('/medicine')}
      />

      <div className="pt-20 pb-8 px-4">
        {/* 검색 입력 */}
        <div className="relative mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="약 이름, 성분, 회사명으로 검색"
            className="w-full p-4 pl-12 pr-10 bg-white border border-gray-200 rounded-xl text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            autoFocus
          />
          <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl"></i>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <i className="ri-close-circle-fill text-xl"></i>
            </button>
          )}
        </div>

        {/* 검색 결과 */}
        {searchQuery ? (
          <div>
            <p className="text-sm text-gray-500 mb-3">
              {searchResults.length > 0
                ? `검색 결과 ${searchResults.length}건`
                : '검색 결과가 없습니다'}
            </p>

            {searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((medicine) => (
                  <button
                    key={medicine.id}
                    onClick={() => handleMedicineSelect(medicine)}
                    className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {medicine.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {medicine.company}
                        </p>
                        <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {medicine.category}
                        </span>
                      </div>
                      <i className="ri-add-circle-line text-2xl text-blue-500"></i>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
                <span className="text-4xl block mb-4">🔍</span>
                <p className="text-gray-600 mb-2">
                  &apos;{searchQuery}&apos;에 대한 검색 결과가 없습니다
                </p>
                <p className="text-sm text-gray-500">
                  다른 검색어로 시도해보세요
                </p>
              </div>
            )}
          </div>
        ) : (
          /* 최근 검색어 & 인기 약물 */
          <div>
            {/* 최근 검색어 */}
            {recentSearches.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">최근 검색</h3>
                  <button
                    onClick={handleClearRecentSearches}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    전체 삭제
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(term)}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-blue-300 hover:text-blue-600 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 카테고리별 약물 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">카테고리</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: '💊', name: '해열진통제', query: '해열진통제' },
                  { icon: '❤️', name: '고혈압치료제', query: '고혈압' },
                  { icon: '🩸', name: '당뇨병치료제', query: '당뇨' },
                  { icon: '🫀', name: '심혈관약', query: '심혈관' },
                  { icon: '🍽️', name: '소화제', query: '소화제' },
                  { icon: '🤧', name: '알레르기약', query: '알레르기' },
                  { icon: '💪', name: '비타민/영양제', query: '비타민' },
                  { icon: '😴', name: '수면/신경안정', query: '수면' },
                ].map((category) => (
                  <button
                    key={category.name}
                    onClick={() => handleRecentSearchClick(category.query)}
                    className="flex items-center space-x-3 bg-white p-4 rounded-xl border border-gray-100 hover:border-blue-300 transition-colors"
                  >
                    <span className="text-2xl">{category.icon}</span>
                    <span className="text-sm font-medium text-gray-700">
                      {category.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 약 추가 모달 */}
      {showAddModal && selectedMedicine && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-2">약 추가</h3>
            <p className="text-sm text-gray-500 mb-6">{selectedMedicine.description}</p>

            <div className="space-y-5">
              {/* 약 이름 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  약 이름
                </label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* 용량 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  용량
                </label>
                <input
                  type="text"
                  value={addForm.dosage}
                  onChange={(e) => setAddForm({ ...addForm, dosage: e.target.value })}
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
                  value={addForm.frequency}
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
                    onClick={() => setAddForm({ ...addForm, beforeMeal: true })}
                    className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                      addForm.beforeMeal
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    식전
                  </button>
                  <button
                    onClick={() => setAddForm({ ...addForm, beforeMeal: false })}
                    className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                      !addForm.beforeMeal
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
                  {addForm.times.map((time, index) => (
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
                  setShowAddModal(false);
                  setSelectedMedicine(null);
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleAddMedicine}
                disabled={isAdding}
                className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {isAdding ? '추가 중...' : '추가하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
