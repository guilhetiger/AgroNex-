import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

if (Platform.OS !== 'web') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (error) {
    console.warn('Notification handler setup failed', error);
  }
}

// Request permissions
export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    throw new Error('Permission not granted for notifications');
  }

  return finalStatus;
}

// Schedule flight reminders
export async function scheduleFlightReminder(
  flightId: string,
  clientName: string,
  scheduledTime: Date,
  reminderMinutes: number = 30
) {
  const reminderTime = new Date(scheduledTime.getTime() - reminderMinutes * 60 * 1000);

  if (reminderTime <= new Date()) {
    throw new Error('Reminder time must be in the future');
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🛩️ Recordatorio de Vuelo',
      body: `Vuelo programado para ${clientName} en ${reminderMinutes} minutos`,
      data: { flightId, type: 'flight_reminder' },
      sound: 'default',
    },
    trigger: { type: 'date', date: reminderTime } as any,
  });

  return identifier;
}

// Schedule weather alerts
export async function scheduleWeatherAlert(
  location: string,
  condition: string,
  severity: 'low' | 'medium' | 'high'
) {
  const title = severity === 'high' ? '⚠️ Alerta Climática Crítica' : '🌤️ Alerta Climática';
  const body = `Condiciones ${condition.toLowerCase()} detectadas en ${location}`;

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { location, condition, severity, type: 'weather_alert' },
      sound: severity === 'high' ? 'default' : undefined,
    },
    trigger: null as any,
  });

  return identifier;
}

// Schedule maintenance reminders
export async function scheduleMaintenanceReminder(
  equipment: string,
  dueDate: Date,
  daysBefore: number = 7
) {
  const reminderTime = new Date(dueDate.getTime() - daysBefore * 24 * 60 * 60 * 1000);

  if (reminderTime <= new Date()) {
    throw new Error('Maintenance reminder time must be in the future');
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔧 Mantenimiento Programado',
      body: `Mantenimiento de ${equipment} vence en ${daysBefore} días`,
      data: { equipment, dueDate: dueDate.toISOString(), type: 'maintenance' },
      sound: 'default',
    },
    trigger: { type: 'date', date: reminderTime } as any,
  });

  return identifier;
}

// Cancel scheduled notifications
export async function cancelNotification(identifier: string) {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

// Get all scheduled notifications
export async function getScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}

// Clear all notifications
export async function clearAllNotifications() {
  await Notifications.dismissAllNotificationsAsync();
}

// Notification types for type safety
export type NotificationType = 'flight_reminder' | 'weather_alert' | 'maintenance';

export interface AgroNexNotification {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

// Helper to create typed notifications
export function createFlightNotification(
  flightId: string,
  clientName: string,
  timeUntil: string
): AgroNexNotification {
  return {
    type: 'flight_reminder',
    title: '🛩️ Vuelo Programado',
    body: `Vuelo para ${clientName} en ${timeUntil}`,
    data: { flightId },
  };
}

export function createWeatherNotification(
  location: string,
  condition: string,
  severity: 'low' | 'medium' | 'high'
): AgroNexNotification {
  const severityEmoji = severity === 'high' ? '⚠️' : severity === 'medium' ? '🌤️' : 'ℹ️';

  return {
    type: 'weather_alert',
    title: `${severityEmoji} Alerta Climática`,
    body: `Condiciones ${condition} en ${location}`,
    data: { location, condition, severity },
  };
}

export function createMaintenanceNotification(
  equipment: string,
  daysUntil: number
): AgroNexNotification {
  return {
    type: 'maintenance',
    title: '🔧 Mantenimiento',
    body: `Mantenimiento de ${equipment} vence en ${daysUntil} días`,
    data: { equipment, daysUntil },
  };
}