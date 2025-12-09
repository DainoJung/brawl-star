'use client';

import { useState, useEffect, useCallback } from 'react';

interface PushSubscriptionState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
}

interface UsePushSubscriptionOptions {
  userId: string;
  autoSubscribe?: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Web Push 구독 관리 Hook
 * iOS 16.4+ PWA에서 백그라운드 알림을 받기 위한 Push 구독 관리
 */
export function usePushSubscription({ userId, autoSubscribe = false }: UsePushSubscriptionOptions) {
  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: true,
    error: null,
  });
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);

  // Push 지원 여부 확인
  useEffect(() => {
    const checkSupport = async () => {
      if (typeof window === 'undefined') return;

      const isSupported =
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;

      setState((prev) => ({ ...prev, isSupported }));

      if (isSupported) {
        // VAPID 공개키 조회
        try {
          const response = await fetch(`${API_URL}/api/push/vapid-public-key`);
          if (response.ok) {
            const data = await response.json();
            setVapidPublicKey(data.publicKey);
          }
        } catch (error) {
          console.error('[Push] VAPID 키 조회 실패:', error);
        }

        // 현재 구독 상태 확인
        await checkSubscription();
      }

      setState((prev) => ({ ...prev, isLoading: false }));
    };

    checkSupport();
  }, []);

  // 자동 구독
  useEffect(() => {
    if (autoSubscribe && state.isSupported && !state.isSubscribed && !state.isLoading && vapidPublicKey) {
      subscribe();
    }
  }, [autoSubscribe, state.isSupported, state.isSubscribed, state.isLoading, vapidPublicKey]);

  // 현재 구독 상태 확인
  const checkSubscription = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setState((prev) => ({ ...prev, isSubscribed: !!subscription }));
    } catch (error) {
      console.error('[Push] 구독 상태 확인 실패:', error);
    }
  }, []);

  // Push 구독
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported || !vapidPublicKey) {
      setState((prev) => ({
        ...prev,
        error: 'Push 알림이 지원되지 않거나 VAPID 키가 없습니다.',
      }));
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // 1. 알림 권한 요청
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: '알림 권한이 거부되었습니다. 설정에서 허용해주세요.',
        }));
        return false;
      }

      // 2. Service Worker 준비
      const registration = await navigator.serviceWorker.ready;

      // 3. 기존 구독 확인
      let subscription = await registration.pushManager.getSubscription();

      // 4. 기존 구독이 없으면 새로 생성
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey,
        });
      }

      // 5. 서버에 구독 정보 전송
      const subscriptionJson = subscription.toJSON();
      console.log('[Push] 서버에 구독 정보 전송:', {
        user_id: userId,
        endpoint: subscriptionJson.endpoint?.substring(0, 50) + '...',
        keys: {
          p256dh: !!subscriptionJson.keys?.p256dh,
          auth: !!subscriptionJson.keys?.auth,
        },
      });

      const response = await fetch(`${API_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          subscription: {
            endpoint: subscriptionJson.endpoint,
            keys: subscriptionJson.keys,
          },
        }),
      });

      const responseData = await response.json();
      console.log('[Push] 서버 응답:', response.status, responseData);

      if (!response.ok) {
        throw new Error(responseData.detail || '서버 구독 등록 실패');
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        isLoading: false,
        error: null,
      }));

      console.log('[Push] 구독 성공');
      return true;
    } catch (error) {
      console.error('[Push] 구독 실패:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '구독에 실패했습니다.',
      }));
      return false;
    }
  }, [state.isSupported, vapidPublicKey, userId]);

  // Push 구독 해제
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // 브라우저에서 구독 해제
        await subscription.unsubscribe();

        // 서버에서 구독 삭제
        await fetch(`${API_URL}/api/push/unsubscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            endpoint: subscription.endpoint,
          }),
        });
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
        error: null,
      }));

      console.log('[Push] 구독 해제 성공');
      return true;
    } catch (error) {
      console.error('[Push] 구독 해제 실패:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '구독 해제에 실패했습니다.',
      }));
      return false;
    }
  }, [userId]);

  // 테스트 알림 발송
  const sendTestNotification = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/push/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          title: '🔔 테스트 알림',
          body: '백그라운드 Push 알림이 정상적으로 작동합니다!',
        }),
      });

      if (!response.ok) {
        throw new Error('테스트 알림 발송 실패');
      }

      return true;
    } catch (error) {
      console.error('[Push] 테스트 알림 실패:', error);
      return false;
    }
  }, [userId]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    sendTestNotification,
    checkSubscription,
  };
}

