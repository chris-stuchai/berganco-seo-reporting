/**
 * Pretty Notification System
 * Replaces browser alerts with styled toast notifications
 */

let notificationContainer = null;

function initNotificationContainer() {
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 400px;
      pointer-events: none;
    `;
    document.body.appendChild(notificationContainer);
  }
  return notificationContainer;
}

function showNotification(message, type = 'info', duration = 5000) {
  initNotificationContainer();
  
  const notification = document.createElement('div');
  const notificationId = 'notif-' + Date.now();
  notification.id = notificationId;
  
  // Determine colors based on type
  const colors = {
    success: {
      bg: '#1C7C3A',
      border: '#2A9D4F',
      icon: '✓',
      iconBg: 'rgba(42, 157, 79, 0.2)'
    },
    error: {
      bg: '#C41E3A',
      border: '#E63946',
      icon: '✕',
      iconBg: 'rgba(230, 57, 70, 0.2)'
    },
    warning: {
      bg: '#FF9F0A',
      border: '#FFB84D',
      icon: '⚠',
      iconBg: 'rgba(255, 191, 77, 0.2)'
    },
    info: {
      bg: '#0A84FF',
      border: '#4DA3FF',
      icon: 'ℹ',
      iconBg: 'rgba(77, 163, 255, 0.2)'
    }
  };
  
  const color = colors[type] || colors.info;
  
  notification.style.cssText = `
    background: ${color.bg};
    border: 1px solid ${color.border};
    border-radius: 12px;
    padding: 16px 20px;
    color: white;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.5;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: flex-start;
    gap: 12px;
    opacity: 0;
    transform: translateX(400px);
    transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    pointer-events: auto;
    max-width: 100%;
    word-wrap: break-word;
  `;
  
  notification.innerHTML = `
    <div style="
      width: 24px;
      height: 24px;
      border-radius: 12px;
      background: ${color.iconBg};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: bold;
      flex-shrink: 0;
      margin-top: 2px;
    ">${color.icon}</div>
    <div style="flex: 1; min-width: 0;">
      <div style="margin: 0; line-height: 1.5;">${message}</div>
    </div>
    <button onclick="this.closest('[id^=notif-]').remove()" style="
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 20px;
      height: 20px;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
      padding: 0;
      margin-top: 2px;
      transition: background 0.2s;
    " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">×</button>
  `;
  
  notificationContainer.appendChild(notification);
  
  // Animate in
  requestAnimationFrame(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  });
  
  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(400px)';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }
  
  return notification;
}

// Replace window.alert with notifications
window.originalAlert = window.alert;
window.alert = function(message) {
  // Detect emoji or type from message
  let type = 'info';
  if (message.includes('✅') || message.includes('Success') || message.includes('successfully')) {
    type = 'success';
    message = message.replace('✅', '').trim();
  } else if (message.includes('❌') || message.includes('Error') || message.includes('Failed')) {
    type = 'error';
    message = message.replace('❌', '').replace('Error:', '').trim();
  } else if (message.includes('⚠') || message.includes('Warning')) {
    type = 'warning';
    message = message.replace('⚠', '').trim();
  }
  
  showNotification(message, type, 6000);
};

// Export functions for manual use
window.showNotification = showNotification;
window.showSuccess = (msg) => showNotification(msg, 'success');
window.showError = (msg) => showNotification(msg, 'error');
window.showWarning = (msg) => showNotification(msg, 'warning');
window.showInfo = (msg) => showNotification(msg, 'info');

