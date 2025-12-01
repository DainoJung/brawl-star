'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import BottomNavigation from '@/components/base/BottomNavigation';
import MedicineCard from '@/components/base/MedicineCard';
import ActionCard from '@/components/base/ActionCard';
import { useMedicineStore } from '@/store/medicine';

export default function Home() {
  const router = useRouter();
  const { userName, alarms, isLoading, fetchAll } = useMedicineStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // 오늘의 스케줄 계산 (캐시된 alarms 사용)
  const { todaySchedules, nextAlarm } = useMemo(() => {
    if (!alarms || alarms.length === 0) {
      return { todaySchedules: [], nextAlarm: null };
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const today = ['일', '월', '화', '수', '목', '금', '토'][now.getDay()];

    // 오늘 요일에 해당하는 활성화된 알람만 필터
    const todayAlarms = alarms.filter(a =>
      a.enabled && a.days?.includes(today)
    );

    // 오늘의 복용 스케줄 생성
    const schedules = todayAlarms.map(alarm => ({
      id: alarm.id,
      name: alarm.medicine_name,
      time: alarm.time,
      status: (alarm.time < currentTime ? 'completed' : 'pending') as 'pending' | 'completed',
    })).sort((a, b) => a.time.localeCompare(b.time));

    // 다음 알람 찾기
    const nextA = todayAlarms
      .filter(a => a.time > currentTime)
      .sort((a, b) => a.time.localeCompare(b.time))[0];

    return {
      todaySchedules: schedules,
      nextAlarm: nextA ? { time: nextA.time, name: nextA.medicine_name } : null,
    };
  }, [alarms]);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour < 12 ? '오전' : '오후';
    const displayHour = hour <= 12 ? hour : hour - 12;
    return `${period} ${displayHour}시 ${minutes !== '00' ? minutes + '분' : ''}`.trim();
  };

  const pendingCount = todaySchedules.filter(s => s.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="pt-6 pb-24 px-4">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            👋 안녕하세요, {userName}님
          </h1>
          <p className="text-lg text-gray-600">
            {isLoading ? '로딩 중...' :
              todaySchedules.length === 0
                ? '등록된 복용 일정이 없습니다'
                : pendingCount > 0
                  ? `오늘 복용해야 할 약이 ${pendingCount}개 있습니다`
                  : '오늘 복용을 모두 완료했습니다! 🎉'}
          </p>
        </div>

        {/* Medicine Cards */}
        <div className="space-y-4 mb-6">
          {isLoading ? (
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-500">복용 일정을 불러오는 중...</p>
            </div>
          ) : todaySchedules.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center">
              <p className="text-gray-500 mb-4">등록된 약이 없습니다</p>
              <button
                onClick={() => router.push('/medicine/prescription-capture')}
                className="text-blue-600 font-semibold"
              >
                + 처방전으로 약 추가하기
              </button>
            </div>
          ) : (
            todaySchedules.slice(0, 4).map((schedule) => (
              <MedicineCard
                key={schedule.id}
                name={`💊 ${schedule.name}`}
                time={schedule.time}
                status={schedule.status}
                onClick={() => router.push('/medicine')}
              />
            ))
          )}
          {todaySchedules.length > 4 && (
            <button
              onClick={() => router.push('/alarm')}
              className="w-full text-center text-blue-600 font-semibold py-2"
            >
              +{todaySchedules.length - 4}개 더 보기
            </button>
          )}
        </div>

        {/* Next Alert */}
        {nextAlarm && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex items-center justify-center bg-blue-500 rounded-full">
                <i className="ri-alarm-line text-white text-lg"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900">다음 알림</h3>
                <p className="text-base text-blue-700">
                  {formatTime(nextAlarm.time)} - {nextAlarm.name}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">빠른 기능</h2>

          <ActionCard
            icon="📷"
            title="약 추가하기"
            subtitle="사진으로 쉽게 등록"
            onClick={() => router.push('/medicine')}
            color="blue"
          />

          <ActionCard
            icon="🤖"
            title="챗봇으로 질문하기"
            subtitle="약에 대해 궁금한 점을 물어보세요"
            onClick={() => router.push('/chatbot')}
            color="green"
          />
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
