'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import TopHeader from '@/components/base/TopHeader';
import { getAlarm, updateAlarm, deleteAlarm } from '@/lib/supabase';
import { useMedicineStore } from '@/store/medicine';

interface AlarmSetting {
  id: string;
  medicine_name: string;
  time: string;
  enabled: boolean;
  days: string[];
  sound: string;
  vibration: boolean;
  gradual_volume: boolean;
  snooze_enabled: boolean;
  snooze_interval: number;
  snooze_count: number;
}

const ALL_DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const SOUND_OPTIONS = [
  { id: 'default', name: '기본 알람음' },
  { id: 'gentle', name: '부드러운 멜로디' },
  { id: 'bell', name: '종소리' },
  { id: 'chime', name: '차임벨' },
];

export default function AlarmDetailPage() {
  const router = useRouter();
  const params = useParams();
  const alarmId = params.id as string;
  const { invalidateCache } = useMedicineStore();

  const [alarm, setAlarm] = useState<AlarmSetting>({
    id: alarmId,
    medicine_name: '',
    time: '08:00',
    enabled: true,
    days: [...ALL_DAYS],
    sound: 'default',
    vibration: true,
    gradual_volume: true,
    snooze_enabled: true,
    snooze_interval: 5,
    snooze_count: 3,
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAlarm = async () => {
      try {
        const data = await getAlarm(alarmId);
        if (data) {
          setAlarm(data);
        }
      } catch (error) {
        console.error('Failed to fetch alarm:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlarm();
  }, [alarmId]);

  const toggleDay = (day: string) => {
    setAlarm(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAlarm(alarmId, {
        medicine_name: alarm.medicine_name,
        time: alarm.time,
        enabled: alarm.enabled,
        days: alarm.days,
        sound: alarm.sound,
        vibration: alarm.vibration,
        gradual_volume: alarm.gradual_volume,
        snooze_enabled: alarm.snooze_enabled,
        snooze_interval: alarm.snooze_interval,
        snooze_count: alarm.snooze_count,
      });
      // 캐시 무효화
      invalidateCache();
      router.push('/alarm');
    } catch (error) {
      console.error('Failed to save alarm:', error);
      alert('알람 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAlarm(alarmId);
      // 캐시 무효화
      invalidateCache();
      setShowDeleteModal(false);
      router.push('/alarm');
    } catch (error) {
      console.error('Failed to delete alarm:', error);
      alert('알람 삭제에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader
        title="알람 설정"
        showBack
        onBack={() => router.push('/alarm')}
      />

      <div className="pt-20 pb-24 px-4">
        {loading ? (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">알람 정보를 불러오는 중...</p>
          </div>
        ) : (
          <>
        {/* 약 이름 */}
        <div className="bg-white rounded-xl p-6 mb-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-2xl">💊</span>
            <h2 className="text-xl font-bold text-gray-900">{alarm.medicine_name}</h2>
          </div>
        </div>

        {/* 시간 설정 */}
        <div className="bg-white rounded-xl p-6 mb-4 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">알람 시간</h3>
          <input
            type="time"
            value={alarm.time}
            onChange={(e) => setAlarm(prev => ({ ...prev, time: e.target.value }))}
            className="w-full text-4xl font-bold text-blue-600 text-center py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* 반복 요일 */}
        <div className="bg-white rounded-xl p-6 mb-4 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">반복 요일</h3>
          <div className="flex justify-between">
            {ALL_DAYS.map((day) => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                  alarm.days.includes(day)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
          <div className="mt-4 flex space-x-2">
            <button
              onClick={() => setAlarm(prev => ({ ...prev, days: [...ALL_DAYS] }))}
              className="flex-1 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg"
            >
              매일
            </button>
            <button
              onClick={() => setAlarm(prev => ({ ...prev, days: ['월', '화', '수', '목', '금'] }))}
              className="flex-1 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg"
            >
              평일
            </button>
            <button
              onClick={() => setAlarm(prev => ({ ...prev, days: ['토', '일'] }))}
              className="flex-1 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg"
            >
              주말
            </button>
          </div>
        </div>

        {/* 알람음 */}
        <div className="bg-white rounded-xl p-6 mb-4 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">알람음</h3>
          <div className="space-y-2">
            {SOUND_OPTIONS.map((sound) => (
              <button
                key={sound.id}
                onClick={() => setAlarm(prev => ({ ...prev, sound: sound.id }))}
                className={`w-full p-4 rounded-xl text-left flex items-center justify-between transition-colors ${
                  alarm.sound === sound.id
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : 'bg-gray-50 border-2 border-transparent'
                }`}
              >
                <span className={alarm.sound === sound.id ? 'text-blue-600 font-medium' : 'text-gray-700'}>
                  {sound.name}
                </span>
                {alarm.sound === sound.id && (
                  <i className="ri-check-line text-blue-500 text-xl"></i>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 진동 */}
        <div className="bg-white rounded-xl p-6 mb-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">진동</h3>
              <p className="text-sm text-gray-600">알람 시 진동을 함께 울립니다</p>
            </div>
            <button
              onClick={() => setAlarm(prev => ({ ...prev, vibration: !prev.vibration }))}
              className={`toggle-switch relative w-14 h-8 rounded-full transition-colors ${
                alarm.vibration ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform shadow-sm ${
                  alarm.vibration ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 알람 소리 천천히 커지기 */}
        <div className="bg-white rounded-xl p-6 mb-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">소리 천천히 커지기</h3>
              <p className="text-sm text-gray-600">갑작스러운 소리를 방지합니다</p>
            </div>
            <button
              onClick={() => setAlarm(prev => ({ ...prev, gradual_volume: !prev.gradual_volume }))}
              className={`toggle-switch relative w-14 h-8 rounded-full transition-colors ${
                alarm.gradual_volume ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform shadow-sm ${
                  alarm.gradual_volume ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 다시 알림 (스누즈) */}
        <div className="bg-white rounded-xl p-6 mb-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">다시 알림</h3>
              <p className="text-sm text-gray-600">알람을 놓쳤을 때 다시 알려드립니다</p>
            </div>
            <button
              onClick={() => setAlarm(prev => ({ ...prev, snooze_enabled: !prev.snooze_enabled }))}
              className={`toggle-switch relative w-14 h-8 rounded-full transition-colors ${
                alarm.snooze_enabled ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform shadow-sm ${
                  alarm.snooze_enabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {alarm.snooze_enabled && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div>
                <label className="text-sm text-gray-600 mb-2 block">다시 알림 간격</label>
                <select
                  value={alarm.snooze_interval}
                  onChange={(e) => setAlarm(prev => ({ ...prev, snooze_interval: Number(e.target.value) }))}
                  className="w-full p-3 border border-gray-200 rounded-xl text-gray-900"
                >
                  <option value={3}>3분</option>
                  <option value={5}>5분</option>
                  <option value={10}>10분</option>
                  <option value={15}>15분</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-2 block">다시 알림 횟수</label>
                <select
                  value={alarm.snooze_count}
                  onChange={(e) => setAlarm(prev => ({ ...prev, snooze_count: Number(e.target.value) }))}
                  className="w-full p-3 border border-gray-200 rounded-xl text-gray-900"
                >
                  <option value={1}>1회</option>
                  <option value={2}>2회</option>
                  <option value={3}>3회</option>
                  <option value={5}>5회</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* 저장 버튼 */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-500 text-white p-4 rounded-xl font-semibold text-lg hover:bg-blue-600 transition-colors mb-4 disabled:bg-blue-300"
        >
          {saving ? '저장 중...' : '저장하기'}
        </button>

        {/* 삭제 버튼 */}
        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full bg-white text-red-500 p-4 rounded-xl font-semibold text-lg border-2 border-red-200 hover:bg-red-50 transition-colors"
        >
          알람 삭제
        </button>
          </>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-2">알람 삭제</h3>
            <p className="text-gray-600 mb-6">
              &apos;{alarm.medicine_name}&apos; 알람을 삭제하시겠습니까?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium"
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
