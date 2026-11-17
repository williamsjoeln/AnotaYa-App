import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const NOTIF_CHANNEL_ID = 'anotaya_reminders_channel';

// Inicializar canal de notificaciones en Android
export async function setupNotificationChannels() {
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.createChannel({
        id: NOTIF_CHANNEL_ID,
        name: 'Recordatorios de Deudas AnotaYa',
        description: 'Notificaciones automáticas de cobros y compromisos de pago',
        importance: 5, // High importance
        visibility: 1, // Public
        sound: 'res_cash.wav',
        vibration: true,
        lights: true,
        lightColor: '#10B981'
      });
    } catch (e) {
      console.warn('Channel creation error (not critical):', e);
    }
  }
}

// Verificar si están soportadas
export function isNotificationSupported() {
  if (Capacitor.isNativePlatform()) return true;
  return 'Notification' in window;
}

// Consultar estado de permiso actual
export async function getNotificationPermissionStatus() {
  if (Capacitor.isNativePlatform()) {
    try {
      const status = await LocalNotifications.checkPermissions();
      return status.display; // 'granted' | 'denied' | 'prompt'
    } catch {
      return 'prompt';
    }
  }
  if ('Notification' in window) {
    return Notification.permission; // 'granted' | 'denied' | 'default'
  }
  return 'denied';
}

// Solicitar permisos nativos al usuario
export async function requestNotificationPermission() {
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (e) {
      console.error('Capacitor notification permission error:', e);
      return false;
    }
  }
  if ('Notification' in window) {
    const res = await Notification.requestPermission();
    return res === 'granted';
  }
  return false;
}

// Enviar notificación de prueba INMEDIATA en el teléfono
export async function sendTestNotification(sampleDebtName = 'Ricardo', sampleAmount = 100) {
  const isNative = Capacitor.isNativePlatform();
  const perm = await getNotificationPermissionStatus();
  
  if (perm !== 'granted') {
    const granted = await requestNotificationPermission();
    if (!granted) return { success: false, reason: 'permission_denied' };
  }

  const title = '🔔 AnotaYa PRO: Recordatorio Activo';
  const body = `Recordatorio: ${sampleDebtName} tiene un saldo pendiente de $${sampleAmount.toFixed(2)}. ¡Toca para ver o cobrar en WhatsApp!`;

  if (isNative) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: 9999,
            schedule: { at: new Date(Date.now() + 1000) }, // 1 segundo después
            channelId: NOTIF_CHANNEL_ID,
            smallIcon: 'ic_launcher',
            actionTypeId: '',
            extra: { type: 'test' }
          }
        ]
      });
      return { success: true, platform: 'native' };
    } catch (e) {
      console.error('Error scheduling native test notification:', e);
    }
  }

  // Fallback para Web / PWA
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, {
          body,
          icon: '/logo.png',
          badge: '/logo.png',
          vibrate: [200, 100, 200]
        });
      } else {
        new Notification(title, {
          body,
          icon: '/logo.png'
        });
      }
      return { success: true, platform: 'web' };
    } catch (e) {
      console.error('Web notification error:', e);
    }
  }

  return { success: false, reason: 'unknown' };
}

// Limpiar de forma definitiva todas las notificaciones programadas en el dispositivo
export async function clearAllScheduledReminders() {
  if (Capacitor.isNativePlatform()) {
    try {
      const pending = await LocalNotifications.getPending();
      if (pending?.notifications?.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }
      // Cancelación forzada de IDs conocidos para garantizar que iOS no mantenga nada en caché
      const knownIds = [{ id: 101 }, { id: 102 }, { id: 103 }, { id: 9999 }];
      for (let i = 0; i < 50; i++) {
        knownIds.push({ id: 1000 + i });
      }
      await LocalNotifications.cancel({ notifications: knownIds }).catch(() => {});
    } catch (e) {
      console.warn('Error clearing pending notifications:', e);
    }
  }
}

// Programar recordatorios automáticos basados en las deudas activas
export async function scheduleSmartReminders(debts = [], settings = {}) {
  const {
    enabled = true,
    frequency = 'daily_morning', // 'daily_morning' | 'twice_daily' | 'due_date_only' | 'custom_hours'
    customHourInterval = 4
  } = settings;

  // 1. SIEMPRE limpiar antes todas las notificaciones previas en iOS / Android
  await clearAllScheduledReminders();

  // 2. Si las notificaciones están desactivadas en los ajustes, salir (ya quedó limpio)
  if (!enabled) {
    return;
  }

  // 3. Filtrar deudas activas (SOLO aquellas que NO están saldadas: !d.isPaid y con saldo restante > 0)
  const activeDebts = debts.filter(d => {
    if (d.isPaid) return false;
    const paid = (d.payments || []).reduce((s, p) => s + (p.amount || 0), 0);
    const remaining = Math.max(0, (d.amount || 0) - paid);
    return remaining > 0;
  });

  // Si todas las deudas están saldadas o no hay saldo pendiente, NO programar nada.
  // Como ya limpiamos todo con clearAllScheduledReminders(), el teléfono quedará en silencio total sin alertas fantasma.
  if (activeDebts.length === 0) {
    return;
  }

  const theyOweMe = activeDebts.filter(d => d.type === 'they_owe_me');
  const iOwe = activeDebts.filter(d => d.type === 'i_owe');

  const totalTheyOwe = theyOweMe.reduce((sum, d) => {
    const paid = (d.payments || []).reduce((s, p) => s + (p.amount || 0), 0);
    return sum + Math.max(0, (d.amount || 0) - paid);
  }, 0);

  const totalIOwe = iOwe.reduce((sum, d) => {
    const paid = (d.payments || []).reduce((s, p) => s + (p.amount || 0), 0);
    return sum + Math.max(0, (d.amount || 0) - paid);
  }, 0);

  if (Capacitor.isNativePlatform()) {
    try {
      const notificationsToSchedule = [];
      const now = new Date();

      // Generar notificaciones según frecuencia seleccionada
      if (frequency === 'daily_morning' || frequency === 'twice_daily') {
        // Mañana (9:00 AM)
        const morning = new Date();
        morning.setHours(9, 0, 0, 0);
        if (morning <= now) morning.setDate(morning.getDate() + 1);

        let msg = '';
        if (theyOweMe.length > 0 && iOwe.length > 0) {
          msg = `Tienes $${totalTheyOwe.toFixed(2)} por cobrar y $${totalIOwe.toFixed(2)} por pagar.`;
        } else if (theyOweMe.length > 0) {
          msg = `Tienes $${totalTheyOwe.toFixed(2)} pendientes por cobrar (${theyOweMe[0].personName} y otros).`;
        } else {
          msg = `Tienes $${totalIOwe.toFixed(2)} pendientes por pagar.`;
        }

        notificationsToSchedule.push({
          id: 101,
          title: '☀️ AnotaYa: Resumen Matutino',
          body: msg,
          schedule: { at: morning, repeats: true, every: 'day' },
          channelId: NOTIF_CHANNEL_ID,
          smallIcon: 'ic_launcher'
        });
      }

      if (frequency === 'twice_daily') {
        // Tarde (6:00 PM)
        const evening = new Date();
        evening.setHours(18, 0, 0, 0);
        if (evening <= now) evening.setDate(evening.getDate() + 1);

        notificationsToSchedule.push({
          id: 102,
          title: '🌙 AnotaYa: Cierre de Día',
          body: `Revisa tus cobros pendientes antes de terminar el día laboral.`,
          schedule: { at: evening, repeats: true, every: 'day' },
          channelId: NOTIF_CHANNEL_ID,
          smallIcon: 'ic_launcher'
        });
      }

      if (frequency === 'custom_hours') {
        // Intervalo personalizado en horas (ej: cada 2, 4 u 8 horas)
        const intervalHours = Math.max(1, customHourInterval || 4);
        const nextTime = new Date(Date.now() + intervalHours * 60 * 60 * 1000);
        notificationsToSchedule.push({
          id: 103,
          title: '🔔 AnotaYa: Recordatorio Programado',
          body: `Tienes deudas y cobros pendientes en tu cuenta. ¡Revisa tus estados de cuenta!`,
          schedule: { at: nextTime, repeats: true, every: 'day' },
          channelId: NOTIF_CHANNEL_ID,
          smallIcon: 'ic_launcher'
        });
      }

      // Recordatorios específicos para deudas con fecha de vencimiento próxima
      activeDebts.forEach((debt, idx) => {
        if (!debt.dueDate) return;
        const [y, m, d] = debt.dueDate.split('-').map(Number);
        const due = new Date(y, m - 1, d, 9, 0, 0); // 9:00 AM del día de vencimiento

        if (due > now) {
          notificationsToSchedule.push({
            id: 1000 + idx,
            title: debt.type === 'they_owe_me' ? '⏰ Recordatorio de Cobro' : '⚠️ Recordatorio de Pago',
            body: debt.type === 'they_owe_me'
              ? `Hoy vence el plazo de ${debt.personName} para pagarte $${debt.amount.toFixed(2)}.`
              : `Hoy vence tu compromiso de pago con ${debt.personName} ($${debt.amount.toFixed(2)}).`,
            schedule: { at: due },
            channelId: NOTIF_CHANNEL_ID,
            smallIcon: 'ic_launcher'
          });
        }
      });

      if (notificationsToSchedule.length > 0) {
        await LocalNotifications.schedule({ notifications: notificationsToSchedule });
      }
    } catch (e) {
      console.warn('Error scheduling reminders on device:', e);
    }
  }
}
