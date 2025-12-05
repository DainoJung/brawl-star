'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import BottomNavigation from '@/components/base/BottomNavigation';
import { useMedicineStore } from '@/store/medicine';

interface AlarmItem {
  id: string;
  medicine_id: string;
  medicine_name: string;
  time: string;
  days: string[];
  enabled: boolean;
}

export default function AlarmPage() {
  const router = useRouter();
  const { medicines, isLoading, fetchAll, updateMedicine } = useMedicineStore();

  // Fetch medicines from store (cached)
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // medicines 데이터를 알람 형식으로 변환
  const alarmItems = useMemo((): AlarmItem[] => {
    if (!medicines || medicines.length === 0) return [];

    const items: AlarmItem[] = [];
    medicines.forEach(medicine => {
      if (medicine.times && Array.isArray(medicine.times)) {
        medicine.times.forEach((time: string, index: number) => {
          items.push({
            id: `${medicine.id}-${index}`,
            medicine_id: medicine.id,
            medicine_name: medicine.name,
            time,
            days: medicine.days || ['월', '화', '수', '목', '금', '토', '일'],
            enabled: true, // 기본적으로 활성화
          });
        });
      }
    });

    return items.sort((a, b) => a.time.localeCompare(b.time));
  }, [medicines]);

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [alarmStopped, setAlarmStopped] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleAlarmClick = (alarm: AlarmItem) => {
    // 약 상세 페이지나 수정 페이지로 이동
    router.push(`/medicine`);
  };

  const playAlarmSound = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }

    const audioContext = audioContextRef.current;

    const playBeep = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const now = audioContext.currentTime;
    for (let i = 0; i < 3; i++) {
      playBeep(880, now + i * 0.4, 0.2);
      playBeep(1100, now + i * 0.4 + 0.2, 0.2);
    }

    // 진동
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
  }, []);

  const startAlarm = useCallback(() => {
    setShowAlarmModal(true);
    setAlarmStopped(false);
    setCapturedImage(null);
    setShowCamera(false);

    // 즉시 첫 알람 재생
    playAlarmSound();

    // 3초마다 알람 반복
    alarmIntervalRef.current = setInterval(() => {
      playAlarmSound();
    }, 3000);
  }, [playAlarmSound]);

  const stopAlarm = useCallback(() => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
  }, []);

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('카메라 접근 오류:', error);
      alert('카메라에 접근할 수 없습니다. 카메라 권한을 확인해주세요.');
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
    stopCamera();
    setShowCamera(false);

    // 사진 촬영 후 검증 시작
    verifyMedicinePhoto(imageData);
  };

  const verifyMedicinePhoto = (imageData: string) => {
    setIsVerifying(true);

    // 실제 구현에서는 AI로 약 사진 검증
    // 여기서는 시뮬레이션 (2초 후 성공)
    setTimeout(() => {
      setIsVerifying(false);
      setAlarmStopped(true);
      stopAlarm();

      // 3초 후 모달 닫기
      setTimeout(() => {
        setShowAlarmModal(false);
        setCapturedImage(null);
      }, 2000);
    }, 1500);
  };

  const handlePreviewAlarm = () => {
    setShowPreviewModal(true);

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const handleTestAlarm = () => {
    setShowPreviewModal(false);
    startAlarm();
  };

  const closePreviewModal = () => {
    setShowPreviewModal(false);
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopAlarm();
      stopCamera();
    };
  }, [stopAlarm]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-6 pb-24 px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">알람 설정</h1>
        {/* Alarm List */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">복약 알람</h2>

          {isLoading ? (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">알람 목록을 불러오는 중...</p>
            </div>
          ) : alarmItems.length === 0 ? (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
              <span className="text-4xl mb-4 block">🔔</span>
              <p className="text-gray-600">등록된 알람이 없습니다.</p>
              <p className="text-gray-500 text-sm mt-1">약을 등록하면 알람이 자동으로 생성됩니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alarmItems.map((alarm) => (
                <div
                  key={alarm.id}
                  onClick={() => handleAlarmClick(alarm)}
                  className="bg-white rounded-xl p-6 shadow-sm border-2 transition-all cursor-pointer hover:shadow-md border-blue-200 bg-blue-50"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">💊</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {alarm.medicine_name}
                        </h3>
                        <p className="text-xl font-bold text-blue-600">
                          {alarm.time}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">반복:</span>
                    <div className="flex space-x-1">
                      {alarm.days?.map((day) => (
                        <span
                          key={day}
                          className="w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium bg-blue-500 text-white"
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alarm Preview */}
        <div className="mt-8">
          <button
            onClick={handlePreviewAlarm}
            className="w-full bg-blue-500 text-white p-4 rounded-xl font-semibold text-lg hover:bg-blue-600 transition-colors"
          >
            알람 미리보기
          </button>
        </div>
      </div>

      <BottomNavigation />

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-4xl">🔔</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">알람 미리보기</h3>
              <p className="text-gray-600">
                실제 알람이 어떻게 울리는지 테스트해보세요
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <div className="flex items-start space-x-3">
                <span className="text-xl">📸</span>
                <div>
                  <p className="font-semibold text-yellow-800">알람 끄는 방법</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    알람이 울리면 약을 손에 올려서 사진을 찍어야 알람이 꺼집니다!
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleTestAlarm}
              className="w-full py-4 rounded-xl font-semibold text-lg mb-3 bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              🔔 알람 테스트 시작
            </button>

            <button
              onClick={closePreviewModal}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* Alarm Active Modal */}
      {showAlarmModal && (
        <div className="fixed inset-0 bg-gradient-to-b from-blue-600 to-blue-800 flex flex-col items-center justify-center z-50 p-4">
          <canvas ref={canvasRef} className="hidden" />

          {!alarmStopped ? (
            <>
              {!showCamera && !capturedImage && (
                <div className="text-center">
                  {/* 알람 아이콘 애니메이션 */}
                  <div className="w-32 h-32 mx-auto mb-8 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-6xl animate-bounce">🔔</span>
                  </div>

                  <h2 className="text-3xl font-bold text-white mb-2">복약 시간!</h2>
                  <p className="text-xl text-blue-100 mb-2">아침 약 (혈압약)</p>
                  <p className="text-5xl font-bold text-white mb-8">08:00</p>

                  {/* 안내 메시지 */}
                  <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-8 max-w-sm mx-auto">
                    <div className="flex items-center justify-center space-x-3 mb-4">
                      <span className="text-3xl">👋</span>
                      <span className="text-3xl">💊</span>
                      <span className="text-3xl">📸</span>
                    </div>
                    <p className="text-white text-lg font-medium">
                      약을 손에 올려서 사진을 찍으면<br />알람이 꺼집니다
                    </p>
                  </div>

                  {/* 카메라 버튼 */}
                  <button
                    onClick={startCamera}
                    className="w-full max-w-sm py-5 bg-white text-blue-600 rounded-2xl font-bold text-xl shadow-lg hover:bg-blue-50 transition-colors"
                  >
                    📷 사진 찍기
                  </button>
                </div>
              )}

              {showCamera && (
                <div className="w-full max-w-md">
                  <div className="text-center mb-4">
                    <p className="text-white text-lg font-medium">
                      약을 손에 올려서 찍어주세요
                    </p>
                  </div>

                  {/* 카메라 뷰 */}
                  <div className="relative rounded-2xl overflow-hidden mb-6 bg-black">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full aspect-[4/3] object-cover"
                    />

                    {/* 가이드 오버레이 */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 border-4 border-white/50 rounded-3xl flex items-center justify-center">
                        <span className="text-6xl opacity-50">✋</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        stopCamera();
                        setShowCamera(false);
                      }}
                      className="flex-1 py-4 bg-white/20 text-white rounded-xl font-semibold"
                    >
                      취소
                    </button>
                    <button
                      onClick={capturePhoto}
                      className="flex-1 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg"
                    >
                      📸 촬영
                    </button>
                  </div>
                </div>
              )}

              {capturedImage && isVerifying && (
                <div className="text-center">
                  <div className="w-64 h-64 mx-auto mb-6 rounded-2xl overflow-hidden border-4 border-white/30">
                    <img src={capturedImage} alt="촬영된 사진" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center justify-center space-x-3 text-white">
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xl font-medium">확인 중...</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* 알람 종료 화면 */
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-6 bg-green-400 rounded-full flex items-center justify-center">
                <span className="text-6xl">✅</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">복약 완료!</h2>
              <p className="text-xl text-blue-100">
                오늘도 건강한 하루 되세요 😊
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
