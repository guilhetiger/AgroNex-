import { scheduleWeatherAlert } from '@services/notificationService';
import type { StoredWeatherAlert } from '@services/weatherAlertStore';

export async function dispatchWeatherNotifications(alerts: StoredWeatherAlert[]): Promise<void> {
  for (const alert of alerts) {
    if (alert.severity === 'low') continue;

    try {
      await scheduleWeatherAlert(
        alert.locationLabel ?? 'Operación agrícola',
        alert.message,
        alert.severity === 'high' ? 'high' : 'medium'
      );
    } catch (error) {
      console.warn('[weather] notification dispatch failed', error);
    }
  }
}
