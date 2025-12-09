'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import BottomNavigation from '@/components/base/BottomNavigation';
import MedicineCard from '@/components/base/MedicineCard';
import ActionCard from '@/components/base/ActionCard';
import { useMedicineStore } from '@/store/medicine';

export default function Home() {
  const router = useRouter();
  const {
    userName,
    medicines,
    isLoading,
    hasHydrated,
    todayLogs,
    fetchAll,
    fetchTodayLogs
  } = useMedicineStore();

  useEffect(() => {
    // hydration 완료 후에만 fetch
    if (hasHydrated) {
      fetchAll();
      fetchTodayLogs();
    }
  }, [hasHydrated, fetchAll, fetchTodayLogs]);

  // 오늘의 스케줄 계산 (medicines + 복용 기록 사용) - 같은 시간 그룹화
  const { groupedSchedules, nextAlarm } = useMemo(() => {
    if (!medicines || medicines.length === 0) {
      return { groupedSchedules: [], nextAlarm: null };
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const today = ['일', '월', '화', '수', '목', '금', '토'][now.getDay()];

    // 오늘 요일에 해당하는 약만 필터 (days가 없으면 매일)
    const todayMedicines = medicines.filter(m =>
      !m.days || m.days.length === 0 || m.days.includes(today)
    );

    // 시간별로 그룹화
    const timeGroups = new Map<string, string[]>();
    todayMedicines.forEach(medicine => {
      if (medicine.times && Array.isArray(medicine.times)) {
        medicine.times.forEach((time: string) => {
          const existing = timeGroups.get(time) || [];
          existing.push(medicine.name);
          timeGroups.set(time, existing);
        });
      }
    });

    // 복용 기록 기반으로 상태 결정
    // time + medicine_name 조합으로 복용 여부 확인
    const takenSet = new Set(
      todayLogs
        .filter(log => log.status === 'taken')
        .map(log => `${log.scheduled_time}-${log.medicine_name}`)
    );

    // 그룹화된 스케줄 생성 (복용 기록 반영)
    const grouped = Array.from(timeGroups.entries())
      .map(([time, names]) => {
        // 해당 시간의 모든 약이 복용되었는지 확인
        const allTaken = names.every(name => takenSet.has(`${time}-${name}`));

        // 상태 결정: 모두 복용 → completed, 그 외 → pending
        const status = allTaken ? 'completed' : 'pending';

        return {
          time,
          names,
          status: status as 'pending' | 'completed',
          takenCount: names.filter(name => takenSet.has(`${time}-${name}`)).length,
        };
      })
      .sort((a, b) => a.time.localeCompare(b.time));

    // 다음 알람 찾기 (아직 복용하지 않은 것 중에서)
    const nextGroup = grouped.find(g => g.status === 'pending' && g.time >= currentTime);

    return {
      groupedSchedules: grouped,
      nextAlarm: nextGroup ? { time: nextGroup.time, names: nextGroup.names } : null,
    };
  }, [medicines, todayLogs]);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour < 12 ? '오전' : '오후';
    const displayHour = hour <= 12 ? hour : hour - 12;
    return `${period} ${displayHour}시 ${minutes !== '00' ? minutes + '분' : ''}`.trim();
  };

  const pendingCount = groupedSchedules.filter(s => s.status === 'pending')
    .reduce((acc, g) => acc + g.names.length, 0);

  const completedCount = groupedSchedules.filter(s => s.status === 'completed')
    .reduce((acc, g) => acc + g.names.length, 0);

  const totalCount = groupedSchedules.reduce((acc, g) => acc + g.names.length, 0);

  // hydration 전이거나 로딩 중일 때만 로딩 표시
  const dataLoading = !hasHydrated || isLoading;

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
            {dataLoading ? '로딩 중...' :
              groupedSchedules.length === 0
                ? '등록된 복용 일정이 없습니다'
                : pendingCount > 0
                  ? `오늘 복용해야 할 약이 ${pendingCount}개 있습니다`
                  : '오늘 복용을 모두 완료했습니다! 🎉'}
          </p>
        </div>

        {/* 복용 현황 요약 */}
        {!dataLoading && totalCount > 0 && (
          <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">💊</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">오늘의 복용 현황</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {completedCount}/{totalCount} 완료
                  </p>
                </div>
              </div>
              <div className="w-16 h-16 relative">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="6"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke={completedCount === totalCount ? '#22c55e' : '#3b82f6'}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${(completedCount / totalCount) * 176} 176`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-700">
                    {Math.round((completedCount / totalCount) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Medicine Cards */}
        <div className="space-y-4 mb-6">
          {dataLoading ? (
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-500">복용 일정을 불러오는 중...</p>
            </div>
          ) : groupedSchedules.length === 0 ? (
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
            groupedSchedules.slice(0, 4).map((schedule) => (
              <MedicineCard
                key={schedule.time}
                name={schedule.names.length > 1
                  ? `💊 ${schedule.names[0]} 외 ${schedule.names.length - 1}개`
                  : `💊 ${schedule.names[0]}`}
                time={schedule.time}
                status={schedule.status}
                onClick={() => router.push('/medicine')}
                subtitle={schedule.names.length > 1 ? schedule.names.join(', ') : undefined}
              />
            ))
          )}
          {groupedSchedules.length > 4 && (
            <button
              onClick={() => router.push('/alarm')}
              className="w-full text-center text-blue-600 font-semibold py-2"
            >
              +{groupedSchedules.length - 4}개 더 보기
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
                  {formatTime(nextAlarm.time)} - {nextAlarm.names.length > 1
                    ? `${nextAlarm.names[0]} 외 ${nextAlarm.names.length - 1}개`
                    : nextAlarm.names[0]}
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
