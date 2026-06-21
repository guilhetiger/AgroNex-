export async function requestNotificationPermissions() {
  return 'unsupported';
}

export async function scheduleFlightReminder() {
  return 'web-noop';
}

export async function scheduleWeatherAlert() {
  return 'web-noop';
}

export async function scheduleMaintenanceReminder() {
  return 'web-noop';
}

export async function cancelNotification() {}

export async function getScheduledNotifications() {
  return [];
}

export async function clearAllNotifications() {}

export type NotificationType = 'flight_reminder' | 'weather_alert' | 'maintenance';

export interface AgroNexNotification {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export function createFlightNotification(
  flightId: string,
  clientName: string,
  timeUntil: string
): AgroNexNotification {
  return {
    type: 'flight_reminder',
    title: 'Vuelo Programado',
    body: `Vuelo para ${clientName} en ${timeUntil}`,
    data: { flightId },
  };
}

export function createWeatherNotification(
  location: string,
  condition: string,
  severity: 'low' | 'medium' | 'high'
): AgroNexNotification {
  return {
    type: 'weather_alert',
    title: `Alerta climatica ${severity}`,
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
    title: 'Mantenimiento',
    body: `Mantenimiento de ${equipment} vence en ${daysUntil} dias`,
    data: { equipment, daysUntil },
  };
}
