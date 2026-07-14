// ============================================================
// Web Notification Bridge – with Service Worker support
// ============================================================

let swRegistration = null;

// Initialise: register service worker and request permission
async function initNotifications() {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    console.warn('Notifications or Service Workers not supported');
    return;
  }

  // Register service worker if not already
  if (!swRegistration) {
    try {
      swRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered');
    } catch (err) {
      console.error('SW registration failed:', err);
      return;
    }
  }

  // Request notification permission if not granted
  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
    }
  }
}

// Send an immediate notification (while page is open)
function sendDeviceNotification(title, body) {
  if (window.settings && window.settings.notificationsEnabled === false) return;
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;

  try {
    if (swRegistration) {
      swRegistration.showNotification(title, {
        body,
        icon: '/icons/favicon.png',
        vibrate: [200, 100, 200]
      });
    } else {
      new Notification(title, { body, icon: '/icons/favicon.png' });
    }
  } catch (e) {
    console.warn('Notification error', e);
  }
}

// Schedule a notification using setTimeout (while page is open)
function scheduleUniversalNotification(title, message, targetTimestamp) {
  const delay = targetTimestamp - Date.now();
  if (delay <= 0) return;

  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    setTimeout(() => {
      sendDeviceNotification(title, message);
    }, delay);
  }
}

// Push subscription – enable true background notifications
async function subscribeToPush(applicationServerKey) {
  if (!swRegistration) {
    console.warn('SW not registered');
    return null;
  }
  try {
    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(applicationServerKey)
    });
    console.log('Push subscribed:', JSON.stringify(subscription));
    // Send this subscription object to your backend
    return subscription;
  } catch (err) {
    console.error('Push subscription failed:', err);
    return null;
  }
}

// Helper: convert VAPID key
function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Test notification
function testNotification() {
  sendDeviceNotification('StudentNija Test', 'Web notification works!');
}

// Expose
window.NotifBridge = {
  isDroidScript: false,
  sendDeviceNotification,
  scheduleUniversalNotification,
  scheduleAndroidAlarm: () => false,
  testNotification,
  requestNotificationPermission: initNotifications,
  subscribeToPush
};

// Auto‑init
document.addEventListener('DOMContentLoaded', () => {
  initNotifications();
});

console.log('✅ Web Notification Bridge with Service Worker ready');