'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { getMedicines, getAlarms } from '@/lib/supabase';

const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001';

function PrescriptionCompleteContent() {
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(true);
  const [medicineCount, setMedicineCount] = useState(0);
  const [nextAlarm, setNextAlarm] = useState<{ time: string; name: string } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);

    // Fetch actual data
    const fetchData = async () => {
      try {
        const medicines = await getMedicines(TEMP_USER_ID);
        setMedicineCount(medicines?.length || 0);

        const alarms = await getAlarms(TEMP_USER_ID);
        if (alarms && alarms.length > 0) {
          // Find next alarm
          const now = new Date();
          const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

          const enabledAlarms = alarms.filter(a => a.enabled);
          const nextA = enabledAlarms.find(a => a.time > currentTime) || enabledAlarms[0];
          if (nextA) {
            setNextAlarm({ time: nextA.time, name: nextA.medicine_name });
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();

    return () => clearTimeout(timer);
  }, []);

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoMedicine = () => {
    router.push('/medicine');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center px-5 relative overflow-hidden">
      {/* 축하 애니메이션 */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][i % 5],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`,
              }}
            ></div>
          ))}
        </div>
      )}

      <div className="text-center relative z-10">
        {/* 성공 아이콘 */}
        <div className="w-32 h-32 mx-auto mb-8 relative">
          <div className="absolute inset-0 bg-green-100 rounded-full animate-ping"></div>
          <div className="relative w-32 h-32 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
            <i className="ri-check-line text-6xl text-white"></i>
          </div>
        </div>

        {/* 완료 메시지 */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          등록 완료!
        </h1>
        <p className="text-xl text-gray-700 mb-8 leading-relaxed">
          총 <span className="text-blue-600 font-bold">{medicineCount}개의 약</span>이<br />
          추가되었어요
        </p>

        {/* 다음 알림 안내 */}
        {nextAlarm && (
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-8 max-w-sm mx-auto">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <i className="ri-alarm-line text-2xl text-blue-600"></i>
              </div>
              <div className="text-left">
                <p className="text-sm text-gray-600">다음 복용 알림</p>
                <p className="text-xl font-bold text-gray-900">{nextAlarm.time}</p>
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                <span className="font-semibold">{nextAlarm.name}</span><br />
                알림 시간에 알려드릴게요
              </p>
            </div>
          </div>
        )}

        {/* 추가 정보 */}
        <div className="space-y-3 mb-8">
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <i className="ri-checkbox-circle-line text-xl text-green-500"></i>
            <span className="text-base">복용 알림이 설정되었어요</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <i className="ri-checkbox-circle-line text-xl text-green-500"></i>
            <span className="text-base">약 정보가 저장되었어요</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <i className="ri-checkbox-circle-line text-xl text-green-500"></i>
            <span className="text-base">상호작용 확인이 완료되었어요</span>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="space-y-3 max-w-sm mx-auto">
          <button
            onClick={handleGoHome}
            className="w-full h-16 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg"
          >
            홈으로 이동
          </button>
          <button
            onClick={handleGoMedicine}
            className="w-full h-16 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl font-bold text-lg hover:bg-blue-50 active:scale-[0.98] transition-all"
          >
            약 관리 보기
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PrescriptionCompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <PrescriptionCompleteContent />
    </Suspense>
  );
}
