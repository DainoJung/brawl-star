'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface AlarmSchedule {
  id: string;
  time: string; // HH:MM 형식
  days: string[]; // ['월', '화', '수', ...]
  medicines: string[];
}

interface UseAlarmSchedulerOptions {
  schedules: AlarmSchedule[];
  enabled: boolean;
  onAlarmTriggered?: (schedule: AlarmSchedule) => void;
}

export function useAlarmScheduler({ schedules, enabled, onAlarmTriggered }: UseAlarmSchedulerOptions) {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastNotifiedRef = useRef<Set<string>>(new Set());
  const onAlarmTriggeredRef = useRef(onAlarmTriggered);

  // 콜백 ref 업데이트
  useEffect(() => {
    onAlarmTriggeredRef.current = onAlarmTriggered;
  }, [onAlarmTriggered]);

  // Service Worker 등록
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('[Alarm] Service Worker 미지원');
      return;
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[Alarm] Service Worker 등록 성공:', registration.scope);
        setIsServiceWorkerReady(true);
      })
      .catch((error) => {
        console.error('[Alarm] Service Worker 등록 실패:', error);
      });

    // Service Worker 메시지 수신 (알림 클릭 등)
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
        const scheduleId = event.data.data?.scheduleId;
        const schedule = schedules.find(s => s.id === scheduleId);
        if (schedule && onAlarmTriggeredRef.current) {
          onAlarmTriggeredRef.current(schedule);
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [schedules]);

  // 알림 권한 확인
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }
    setPermissionStatus(Notification.permission);
  }, []);

  // 알림 권한 요청
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('[Alarm] 이 브라우저는 알림을 지원하지 않습니다.');
      return false;
    }

    if (Notification.permission === 'granted') {
      setPermissionStatus('granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      setPermissionStatus('denied');
      return false;
    }

    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);
    return permission === 'granted';
  }, []);

  // 알람 소리 재생
  const playAlarmSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

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
    } catch (error) {
      console.error('[Alarm] 소리 재생 오류:', error);
    }
  }, []);

  // 알림 표시
  const showNotification = useCallback(
    async (schedule: AlarmSchedule) => {
      if (permissionStatus !== 'granted') {
        console.log('[Alarm] 알림 권한 없음');
        return;
      }

      const medicineList = schedule.medicines.join(', ');
      const title = '💊 복약 시간입니다!';
      const body = `${schedule.time} - ${medicineList}`;

      // Service Worker를 통해 알림 표시
      if (isServiceWorkerReady && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          body,
          tag: `alarm-${schedule.id}`,
          data: { scheduleId: schedule.id, medicines: schedule.medicines, time: schedule.time }
        });
      } else {
        // 폴백: 직접 알림 표시
        const notification = new Notification(title, {
          body,
          icon: '/icon-192.png',
          tag: `alarm-${schedule.id}`,
          requireInteraction: true
        });

        notification.onclick = () => {
          window.focus();
          if (onAlarmTriggeredRef.current) {
            onAlarmTriggeredRef.current(schedule);
          }
          notification.close();
        };
      }

      // 소리 재생
      playAlarmSound();

      // 콜백 호출 (알람 모달 표시)
      if (onAlarmTriggeredRef.current) {
        onAlarmTriggeredRef.current(schedule);
      }
    },
    [permissionStatus, isServiceWorkerReady, playAlarmSound]
  );

  // 현재 시간이 알람 시간인지 확인
  const checkAlarms = useCallback(() => {
    if (!enabled || schedules.length === 0) return;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDay = ['일', '월', '화', '수', '목', '금', '토'][now.getDay()];
    const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

    schedules.forEach((schedule) => {
      // 오늘 요일에 해당하는지 확인
      if (!schedule.days.includes(currentDay)) return;

      // 현재 시간과 일치하는지 확인
      if (schedule.time !== currentTime) return;

      // 오늘 이미 알림을 보냈는지 확인
      const notificationKey = `${todayKey}-${schedule.id}`;
      if (lastNotifiedRef.current.has(notificationKey)) return;

      // 알림 표시
      console.log('[Alarm] 알림 발송:', schedule);
      showNotification(schedule);
      lastNotifiedRef.current.add(notificationKey);
    });
  }, [enabled, schedules, showNotification]);

  // 매분 알람 체크
  useEffect(() => {
    if (!enabled) {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      return;
    }

    // 즉시 한 번 체크
    checkAlarms();

    // 매 분 정각에 체크하도록 설정
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    const startInterval = () => {
      checkIntervalRef.current = setInterval(checkAlarms, 60 * 1000);
    };

    // 다음 정각에 시작
    const timeout = setTimeout(() => {
      checkAlarms();
      startInterval();
    }, msUntilNextMinute);

    return () => {
      clearTimeout(timeout);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [enabled, checkAlarms]);

  // 자정에 알림 기록 초기화
  useEffect(() => {
    const resetAtMidnight = () => {
      const now = new Date();
      const msUntilMidnight =
        new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0).getTime() -
        now.getTime();

      setTimeout(() => {
        lastNotifiedRef.current.clear();
        resetAtMidnight();
      }, msUntilMidnight);
    };

    resetAtMidnight();
  }, []);

  // 수동으로 알람 트리거 (테스트용)
  const triggerAlarm = useCallback((schedule: AlarmSchedule) => {
    showNotification(schedule);
  }, [showNotification]);

  return {
    permissionStatus,
    isServiceWorkerReady,
    requestPermission,
    showNotification,
    playAlarmSound,
    triggerAlarm
  };
}
