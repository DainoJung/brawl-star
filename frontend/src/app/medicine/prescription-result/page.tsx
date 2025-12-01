'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopHeader from '@/components/base/TopHeader';
import { useMedicineStore } from '@/store/medicine';

interface MedicineResult {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timing: string;
  confidence: number;
  originalText: string;
  status: 'auto' | 'check' | 'review';
  warning?: string;
}

// Helper to determine status based on confidence
const getStatusFromConfidence = (confidence: number): 'auto' | 'check' | 'review' => {
  if (confidence >= 85) return 'auto';
  if (confidence >= 60) return 'check';
  return 'review';
};

export default function PrescriptionResultPage() {
  const router = useRouter();
  const { ocrResults } = useMedicineStore();
  const [filter, setFilter] = useState<'all' | 'check'>('all');
  const [medicines, setMedicines] = useState<MedicineResult[]>([]);

  // Initialize from store or use mock data
  useEffect(() => {
    if (ocrResults && ocrResults.length > 0) {
      // Transform OCR results to display format
      const transformed = ocrResults.map((result, index) => ({
        id: result.id || String(index + 1),
        name: result.name,
        dosage: result.dosage,
        frequency: result.frequency,
        timing: result.timing === 'before_meal' ? '식전' : '식후',
        confidence: result.confidence || 80,
        originalText: result.original_text || result.name,
        status: getStatusFromConfidence(result.confidence || 80) as 'auto' | 'check' | 'review',
        warning: result.warning,
      }));
      setMedicines(transformed);
    } else {
      // No OCR results, redirect back
      router.push('/medicine/prescription-capture');
    }
  }, [ocrResults, router]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineResult | null>(null);

  const filteredMedicines = filter === 'all'
    ? medicines
    : medicines.filter(m => m.status === 'check' || m.status === 'review');

  const hasWarnings = medicines.some(m => m.warning);

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 85) {
      return {
        color: 'bg-blue-100 text-blue-700 border-blue-300',
        text: '자동선택',
      };
    } else if (confidence >= 60) {
      return {
        color: 'bg-orange-100 text-orange-700 border-orange-300',
        text: '확인 필요',
      };
    } else {
      return {
        color: 'bg-gray-100 text-gray-700 border-gray-300',
        text: '검토 필요',
      };
    }
  };

  const handleEdit = (medicine: MedicineResult) => {
    setSelectedMedicine(medicine);
    setShowEditModal(true);
  };

  const handleDelete = (id: string) => {
    setMedicines(medicines.filter(m => m.id !== id));
  };

  const handleConfirmAll = () => {
    if (hasWarnings) {
      const confirmed = window.confirm(
        '주의 성분이 있습니다.\n함께 드시면 어지러울 수 있어요.\n시간 간격을 두거나 전문가와 상의하세요.\n\n그래도 등록하시겠어요?'
      );
      if (confirmed) {
        router.push('/medicine/prescription-schedule');
      }
    } else {
      router.push('/medicine/prescription-schedule');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader
        title="인식된 약 확인"
        showBack
        onBack={() => router.push('/medicine')}
      />

      <div className="pt-20 pb-32 px-5">
        {/* 안내 메시지 */}
        <div className="bg-blue-50 rounded-xl p-5 mb-6">
          <div className="flex items-start space-x-3">
            <i className="ri-information-line text-xl text-blue-600 flex-shrink-0 mt-0.5"></i>
            <p className="text-base text-gray-700 leading-relaxed">
              <span className="font-semibold">앱이 약을 자동으로 골랐어요.</span><br />
              틀리면 &apos;수정&apos;을 눌러 바꿔주세요.
            </p>
          </div>
        </div>

        {/* 경고 패널 */}
        {hasWarnings && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5 mb-6">
            <div className="flex items-start space-x-3">
              <i className="ri-error-warning-line text-2xl text-red-600 flex-shrink-0"></i>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 mb-2">
                  함께 복용 주의
                </h3>
                <p className="text-base text-red-800 leading-relaxed mb-3">
                  다음 약끼리는 함께 복용을 피하세요:<br />
                  <span className="font-semibold">암로디핀 — 메트포르민</span> (병용 주의)
                </p>
                <p className="text-sm text-red-700">
                  함께 드시면 어지러울 수 있어요.<br />
                  시간 간격을 두거나 전문가와 상의하세요.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 필터 칩 */}
        <div className="flex space-x-3 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 rounded-full font-semibold text-base transition-all ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border-2 border-gray-200'
            }`}
          >
            전체 ({medicines.length})
          </button>
          <button
            onClick={() => setFilter('check')}
            className={`px-6 py-3 rounded-full font-semibold text-base transition-all ${
              filter === 'check'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-600 border-2 border-gray-200'
            }`}
          >
            확인 필요 ({medicines.filter(m => m.status !== 'auto').length})
          </button>
        </div>

        {/* 약 목록 */}
        <div className="space-y-4">
          {filteredMedicines.map((medicine) => {
            const badge = getConfidenceBadge(medicine.confidence);
            return (
              <div
                key={medicine.id}
                className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-100"
              >
                {/* 약 이름 & 배지 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {medicine.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold border-2 ${badge.color}`}>
                        {badge.text} {medicine.confidence}%
                      </span>
                      {medicine.warning && (
                        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700 border-2 border-red-300 flex items-center space-x-1">
                          <i className="ri-error-warning-line"></i>
                          <span>주의</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 추출 정보 */}
                <div className="bg-gray-50 rounded-xl p-4 mb-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">용량</p>
                      <p className="text-base font-semibold text-gray-900">{medicine.dosage}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">복용 횟수</p>
                      <p className="text-base font-semibold text-gray-900">{medicine.frequency}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">복용 시기</p>
                      <p className="text-base font-semibold text-gray-900">{medicine.timing}</p>
                    </div>
                  </div>
                </div>

                {/* 원문 스니펫 */}
                <div className="mb-4">
                  <p className="text-xs text-gray-400 mb-1">원문</p>
                  <p className="text-sm text-gray-500 italic">{medicine.originalText}</p>
                </div>

                {/* 액션 버튼 */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleEdit(medicine)}
                    className="flex-1 h-16 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
                  >
                    <i className="ri-edit-line text-xl"></i>
                    <span>수정</span>
                  </button>
                  <button
                    onClick={() => handleDelete(medicine.id)}
                    className="h-16 w-16 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 active:scale-[0.98] transition-all flex items-center justify-center"
                  >
                    <i className="ri-delete-bin-line text-2xl"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 확인 필요 안내 */}
        {filteredMedicines.some(m => m.status === 'check' || m.status === 'review') && (
          <div className="mt-6 bg-orange-50 rounded-xl p-5">
            <div className="flex items-start space-x-3">
              <i className="ri-error-warning-line text-xl text-orange-600 flex-shrink-0 mt-0.5"></i>
              <p className="text-base text-gray-700 leading-relaxed">
                <span className="font-semibold">글자가 흐릿해 헷갈렸어요.</span><br />
                한번 확인 부탁드려요.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-5 shadow-lg">
        <button
          onClick={handleConfirmAll}
          disabled={medicines.length === 0}
          className={`w-full h-20 rounded-2xl font-bold text-xl transition-all ${
            medicines.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-lg'
          }`}
        >
          모두 확정 ({medicines.length}개)
        </button>
      </div>

      {/* 수정 모달 */}
      {showEditModal && selectedMedicine && (
        <EditMedicineModal
          medicine={selectedMedicine}
          onClose={() => setShowEditModal(false)}
          onSave={(updated) => {
            setMedicines(medicines.map(m => m.id === updated.id ? updated : m));
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
}

// 수정 모달 컴포넌트
interface EditMedicineModalProps {
  medicine: MedicineResult;
  onClose: () => void;
  onSave: (medicine: MedicineResult) => void;
}

function EditMedicineModal({ medicine, onClose, onSave }: EditMedicineModalProps) {
  const [selectedCandidate, setSelectedCandidate] = useState(medicine.name);

  const candidates = [
    { name: '암로디핀정 5mg', ingredient: '암로디핀 베실산염', confidence: 92 },
    { name: '암로디핀 베실산염 5mg', ingredient: '암로디핀', confidence: 88 },
    { name: '암로디핀정 10mg', ingredient: '암로디핀 베실산염', confidence: 77 },
  ];

  const handleSave = () => {
    onSave({
      ...medicine,
      name: selectedCandidate,
      status: 'auto',
      confidence: 95,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-3xl max-h-[85vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b-2 border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-gray-900">약 선택 변경</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200"
            >
              <i className="ri-close-line text-2xl text-gray-600"></i>
            </button>
          </div>
          <p className="text-base text-gray-600">
            정확한 약을 선택해주세요
          </p>
        </div>

        <div className="p-5">
          {/* 추천 리스트 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">추천 약</h3>
            <div className="space-y-3">
              {candidates.map((candidate, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedCandidate(candidate.name)}
                  className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                    selectedCandidate === candidate.name
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-lg font-bold text-gray-900">{candidate.name}</h4>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                      {candidate.confidence}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">성분: {candidate.ingredient}</p>
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
              선택 적용
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
