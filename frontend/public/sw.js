// Service Worker for Medicine Reminder PWA

const CACHE_NAME = 'medicine-reminder-v1';

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

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 알림 클릭됨:', event.notification.tag);
  event.notification.close();

  // 앱 열기
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
});

// 알림 닫기 처리
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] 알림 닫힘:', event.notification.tag);
});

// 메시지 수신 (메인 스레드에서 알림 요청)
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

// 알림 액션 처리
self.addEventListener('notificationclick', (event) => {
  const action = event.action;
  const notification = event.notification;

  notification.close();

  if (action === 'take') {
    // 복용 완료 처리
    console.log('[SW] 복용 완료');
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({
            type: 'MEDICINE_TAKEN',
            data: notification.data
          });
        });
      })
    );
  } else if (action === 'snooze') {
    // 5분 후 다시 알림
    console.log('[SW] 5분 후 다시 알림');
    setTimeout(() => {
      self.registration.showNotification(notification.title, {
        body: notification.body,
        tag: notification.tag + '-snooze',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200, 100, 200],
        requireInteraction: true,
        data: notification.data
      });
    }, 5 * 60 * 1000);
  } else {
    // 알림 클릭 시 앱 열기
    event.waitUntil(
      clients.openWindow('/alarm')
    );
  }
});
