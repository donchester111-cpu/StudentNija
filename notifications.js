// notifications.js – Push subscription + standard notifications

let swRegistration = null;
const VAPID_PUBLIC_KEY = 'BDD0-BVNaAthsdxHLXa5VmeR8F9NrGRhPw4gu-N2mRp3SpO7sZBZ6cML0MGTQARRRppvAllZlu-WJccKoBx31ro';
const BACKEND_URL = 'https://studentnija-public-chat.onrender.com'; // ← CHANGE THIS to your Render URL

async function initNotifications() {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    console.warn('Notifications not supported');
    return;
  }
  if (!swRegistration) {
    try {
      swRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ SW registered');
    } catch (err) {
      console.error('SW registration failed:', err);
      return;
    }
  }
  if (Notification.permission === 'default') {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      await subscribeToPush();
    }
  }
}

async function subscribeToPush() {
  if (!swRegistration) return;
  try {
    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    console.log('Push subscribed:', subscription);
    await fetch(`${BACKEND_URL}/api/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
    console.log('Subscription saved on server');
  } catch (err) {
    console.error('Push subscription failed:', err);
  }
}

function sendDeviceNotification(title, body) {
  if (window.settings && window.settings.notificationsEnabled === false) return;
  if (Notification.permission !== 'granted') return;
  try {
    if (swRegistration) {
      swRegistration.showNotification(title, { body, icon: '/icons/favicon.png' });
    } else {
      new Notification(title, { body, icon: '/icons/favicon.png' });
    }
  } catch (e) {}
}

function scheduleUniversalNotification(title, message, targetTimestamp) {
  const delay = targetTimestamp - Date.now();
  if (delay <= 0) return;
  if (Notification.permission === 'granted') {
    setTimeout(() => sendDeviceNotification(title, message), delay);
  }
}

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

function testNotification() {
  sendDeviceNotification('StudentNija', 'Web push is working!');
}

window.NotifBridge = {
  isDroidScript: false,
  sendDeviceNotification,
  scheduleUniversalNotification,
  scheduleAndroidAlarm: () => false,
  testNotification,
  requestNotificationPermission: initNotifications,
  subscribeToPush
};

document.addEventListener('DOMContentLoaded', () => {
  initNotifications();
});

console.log('✅ Push Notification Bridge ready');
