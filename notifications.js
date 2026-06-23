// DroidScript Native Notification Bridge – uses AlarmManager for exact scheduling
const isDroidScript = typeof app !== 'undefined' && app && typeof app.CreateAlarmManager === 'function';

// Immediate notification (works even if app is closed in DroidScript)
function sendDeviceNotification(title, body) {
  if (!window.settings || window.settings.notificationsEnabled === false) return;
  
  if (isDroidScript && app && app.CreateNotification) {
    try {
      var notify = app.CreateNotification();
      notify.SetMessage(body, title, "");
      notify.Notify();
      return;
    } catch(e) { console.log("DroidScript notify error", e); }
  }
  // Fallback for browsers (only while page is open)
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification(title, { body: body });
  }
}

// Schedule a notification at an exact future time using Android AlarmManager
function scheduleAndroidAlarm(title, message, timestamp) {
  if (!isDroidScript) return false;
  try {
    var alarm = app.CreateAlarmManager();
    if (alarm) {
      alarm.SetNotification(title, message);
      alarm.SetTrigger(timestamp);
      alarm.Start();
      return true;
    }
    return false;
  } catch(e) { console.error("Android alarm error", e); return false; }
}

// Universal scheduler: uses Android AlarmManager if available, else web timeout
function scheduleUniversalNotification(title, message, targetTimestamp) {
  const delay = targetTimestamp - Date.now();
  if (delay <= 0) return;
  if (isDroidScript) {
    scheduleAndroidAlarm(title, message, targetTimestamp);
  } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    setTimeout(() => sendDeviceNotification(title, message), delay);
  }
}

// Test immediate notification (for verifying bridge)
function testNotification() {
  const msg = isDroidScript ? "Native Android notification works!" : "Web notification (while app open)";
  sendDeviceNotification("StudentNija Test", msg);
}

// Request permission (for browsers only)
function requestNotificationPermission() {
  if (!isDroidScript && typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
}

// Expose to global scope for app.js
window.NotifBridge = {
  isDroidScript,
  sendDeviceNotification,
  scheduleUniversalNotification,
  scheduleAndroidAlarm,
  testNotification,
  requestNotificationPermission
};