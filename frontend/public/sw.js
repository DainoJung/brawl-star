// Service Worker for Medicine Reminder PWA
// iOS PWA 백그라운드 Push 알림 지원

const CACHE_NAME = 'medicine-reminder-v2';

// 설치 시 기본 캐시
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker 설치됨');
  self.skipWaiting();
});

// 활성화
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker 활성화됨');
  event.waitUntil(clients.claim());
});

// ==========================================
// Push 알림 수신 (서버에서 발송한 알림)
// ==========================================
self.addEventListener('push', (event) => {
  console.log('[SW] Push 수신:', event);

  let data = {
    title: '💊 복약 시간입니다!',
    body: '약을 복용해주세요.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'alarm-default',
    data: {},
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200]
  };

  // Push 데이터 파싱
  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      // JSON이 아닌 경우 텍스트로 처리
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag,
    data: data.data,
    requireInteraction: data.requireInteraction !== false,
    vibrate: data.vibrate || [200, 100, 200, 100, 200],
    actions: [
      { action: 'take', title: '복용 완료' },
      { action: 'snooze', title: '5분 후 알림' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ==========================================
// 알림 클릭 처리
// ==========================================
self.addEventListener('notificationclick', (event) => {
  const action = event.action;
  const notification = event.notification;

  console.log('[SW] 알림 클릭됨:', notification.tag, 'action:', action);
  notification.close();

  if (action === 'take') {
    // 복용 완료 처리
    console.log('[SW] 복용 완료 액션');
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // 열린 창에 메시지 전송
        clientList.forEach((client) => {
          client.postMessage({
            type: 'MEDICINE_TAKEN',
            data: notification.data
          });
        });

        // 창이 없으면 열기
        if (clientList.length === 0 && clients.openWindow) {
          return clients.openWindow('/alarm?action=taken&data=' + encodeURIComponent(JSON.stringify(notification.data)));
        }

        // 이미 열린 창 포커스
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus();
          }
        }
      })
    );
  } else if (action === 'snooze') {
    // 5분 후 다시 알림 (로컬에서 처리)
    console.log('[SW] 5분 후 다시 알림 예약');
    event.waitUntil(
      new Promise((resolve) => {
        setTimeout(() => {
          self.registration.showNotification(notification.title, {
            body: notification.body,
            tag: notification.tag + '-snooze-' + Date.now(),
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [200, 100, 200, 100, 200],
            requireInteraction: true,
            data: notification.data,
            actions: [
              { action: 'take', title: '복용 완료' },
              { action: 'snooze', title: '5분 후 알림' }
            ]
          }).then(resolve);
        }, 5 * 60 * 1000); // 5분
      })
    );
  } else {
    // 기본 클릭: 앱 열기 또는 포커스
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // 이미 열린 창이 있으면 포커스
        for (const client of clientList) {
          if (client.url.includes('/alarm') && 'focus' in client) {
            return client.focus();
          }
        }
        // 없으면 새 창 열기
        if (clients.openWindow) {
          return clients.openWindow('/alarm');
        }
      })
    );
  }
});

// 알림 닫기 처리
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] 알림 닫힘:', event.notification.tag);
});

// ==========================================
// 메시지 수신 (메인 스레드에서 알림 요청)
// ==========================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag, data } = event.data;

    self.registration.showNotification(title, {
      body,
      tag,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200, 100, 200],
      requireInteraction: true,
      data,
      actions: [
        { action: 'take', title: '복용 완료' },
        { action: 'snooze', title: '5분 후 알림' }
      ]
    });
  }
});

// ==========================================
// Push 구독 변경 이벤트
// ==========================================
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Push 구독 변경됨');
  // 새 구독 정보로 서버 업데이트 필요
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true
    }).then((subscription) => {
      // 서버에 새 구독 정보 전송
      return fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: 'TODO', // 실제 구현 시 저장된 user_id 사용
          subscription: subscription.toJSON()
        })
      });
    })
  );
});
