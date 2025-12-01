'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopHeader from '@/components/base/TopHeader';
import { useMedicineStore } from '@/store/medicine';

// Mock OCR results for simulation mode
const MOCK_OCR_RESULTS = [
  {
    id: '1',
    name: '암로디핀정 5mg',
    dosage: '1정',
    frequency: '1일 1회',
    timing: 'after_meal',
    times: ['08:00'],
    confidence: 92,
    original_text: '암로디핀정 5mg 1정 1일 1회 아침 식후',
  },
  {
    id: '2',
    name: '메트포르민정 500mg',
    dosage: '1정',
    frequency: '1일 2회',
    timing: 'after_meal',
    times: ['08:00', '18:00'],
    confidence: 88,
    original_text: '메트포르민정 500mg 1정 1일 2회 아침저녁 식후',
    warning: '병용 주의',
  },
  {
    id: '3',
    name: '아스피린정 100mg',
    dosage: '1정',
    frequency: '1일 1회',
    timing: 'after_meal',
    times: ['08:00'],
    confidence: 95,
    original_text: '아스피린정 100mg 1정 1일 1회 아침 식후',
  },
  {
    id: '4',
    name: '오메프라졸캡슐 20mg',
    dosage: '1캡슐',
    frequency: '1일 1회',
    timing: 'before_meal',
    times: ['07:30'],
    confidence: 78,
    original_text: '오메프라졸캡슐 20mg 1캡슐 1일 1회 아침 식전',
  },
];

export default function PrescriptionProcessingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const { setOcrResults } = useMedicineStore();

  useEffect(() => {
    // 단계별 진행 시뮬레이션
    const timer1 = setTimeout(() => setStep(2), 1500);
    const timer2 = setTimeout(() => setStep(3), 3000);
    const timer3 = setTimeout(() => {
      // Set mock OCR results to store before navigating
      setOcrResults(MOCK_OCR_RESULTS);
      router.push('/medicine/prescription-result');
    }, 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [router, setOcrResults]);

  const steps = [
    { id: 1, label: 'OCR 텍스트 인식', icon: 'ri-scan-line' },
    { id: 2, label: '약명 후보 탐색', icon: 'ri-search-line' },
    { id: 3, label: 'RAG 매칭', icon: 'ri-links-line' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      <TopHeader
        title="처방전 인식 중"
        showBack={false}
      />

      <div className="flex-1 flex items-center justify-center px-5 pt-20 pb-8">
        <div className="w-full max-w-md">
          {/* 로딩 애니메이션 */}
          <div className="text-center mb-12">
            <div className="w-32 h-32 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
              <div className="relative w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center">
                <i className="ri-file-list-3-line text-5xl text-white"></i>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              처방전을 분석하고 있어요
            </h2>
            <p className="text-base text-gray-600">
              잠시만 기다려주세요
            </p>
          </div>

          {/* 진행 단계 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="space-y-5">
              {steps.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center space-x-4 p-4 rounded-xl transition-all ${
                    step >= s.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 border-2 border-gray-200'
                  }`}
                >
                  <div
                    className={`w-14 h-14 flex items-center justify-center rounded-full flex-shrink-0 ${
                      step > s.id
                        ? 'bg-green-500'
                        : step === s.id
                        ? 'bg-blue-500 animate-pulse'
                        : 'bg-gray-300'
                    }`}
                  >
                    {step > s.id ? (
                      <i className="ri-check-line text-2xl text-white"></i>
                    ) : (
                      <i className={`${s.icon} text-2xl text-white`}></i>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3
                        className={`text-lg font-semibold ${
                          step >= s.id ? 'text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        {s.label}
                      </h3>
                      {step === s.id && (
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      )}
                      {step > s.id && (
                        <span className="text-sm font-medium text-green-600">완료</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {s.id === 1 && '처방전에서 글자를 읽고 있어요'}
                      {s.id === 2 && '약 이름을 찾고 있어요'}
                      {s.id === 3 && '정확한 약 정보를 매칭하고 있어요'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* 진행률 바 */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>진행률</span>
                <span className="font-semibold">{Math.round((step / 3) * 100)}%</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
                  style={{ width: `${(step / 3) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* 안내 메시지 */}
          <div className="mt-6 bg-blue-50 rounded-xl p-5">
            <div className="flex items-start space-x-3">
              <i className="ri-information-line text-xl text-blue-600 flex-shrink-0 mt-0.5"></i>
              <p className="text-sm text-gray-700 leading-relaxed">
                처방전의 글자가 흐릿하거나 구겨진 경우<br />
                인식이 정확하지 않을 수 있어요.<br />
                다음 화면에서 확인해주세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
