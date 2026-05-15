import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import {
  requestNotificationPermissions,
  scheduleFlightReminder,
  scheduleWeatherAlert,
  scheduleMaintenanceReminder,
  cancelNotification,
  getScheduledNotifications,
  clearAllNotifications,
  AgroNexNotification,
} from '../services/notificationService';

export function useNotifications() {
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);
  const [scheduledNotifications, setScheduledNotifications] = useState<Notifications.NotificationRequest[]>([]);

  // Request permissions on mount
  useEffect(() => {
    requestPermissions();
    loadScheduledNotifications();
  }, []);

  const requestPermissions = async () => {
    try {
      const status = await requestNotificationPermissions();
      setPermissionStatus(status);
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      setPermissionStatus(null);
    }
  };

  const loadScheduledNotifications = async () => {
    try {
      const notifications = await getScheduledNotifications();
      setScheduledNotifications(notifications);
    } catch (error) {
      console.error('Failed to load scheduled notifications:', error);
    }
  };

  const scheduleFlightNotification = async (
    flightId: string,
    clientName: string,
    scheduledTime: Date,
    reminderMinutes: number = 30
  ) => {
    try {
      const identifier = await scheduleFlightReminder(flightId, clientName, scheduledTime, reminderMinutes);
      await loadScheduledNotifications();
      return identifier;
    } catch (error) {
      console.error('Failed to schedule flight notification:', error);
      throw error;
    }
  };

  const scheduleWeatherNotification = async (
    location: string,
    condition: string,
    severity: 'low' | 'medium' | 'high' = 'medium'
  ) => {
    try {
      const identifier = await scheduleWeatherAlert(location, condition, severity);
      await loadScheduledNotifications();
      return identifier;
    } catch (error) {
      console.error('Failed to schedule weather notification:', error);
      throw error;
    }
  };

  const scheduleMaintenanceNotification = async (
    equipment: string,
    dueDate: Date,
    daysBefore: number = 7
  ) => {
    try {
      const identifier = await scheduleMaintenanceReminder(equipment, dueDate, daysBefore);
      await loadScheduledNotifications();
      return identifier;
    } catch (error) {
      console.error('Failed to schedule maintenance notification:', error);
      throw error;
    }
  };

  const cancelScheduledNotification = async (identifier: string) => {
    try {
      await cancelNotification(identifier);
      await loadScheduledNotifications();
    } catch (error) {
      console.error('Failed to cancel notification:', error);
      throw error;
    }
  };

  const clearAllScheduledNotifications = async () => {
    try {
      await clearAllNotifications();
      setScheduledNotifications([]);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      throw error;
    }
  };

  return {
    permissionStatus,
    scheduledNotifications,
    requestPermissions,
    scheduleFlightNotification,
    scheduleWeatherNotification,
    scheduleMaintenanceNotification,
    cancelScheduledNotification,
    clearAllScheduledNotifications,
    loadScheduledNotifications,
  };
}

// Hook for listening to incoming notifications
export function useNotificationListener() {
  const [lastNotification, setLastNotification] = useState<Notifications.Notification | null>(null);

  useEffect(() => {
    // Listen for notifications received while app is foregrounded
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      setLastNotification(notification);
    });

    // Listen for notifications tapped/opened
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      const { notification } = response;
      setLastNotification(notification);
      // Handle notification tap here
      console.log('Notification tapped:', notification.request.content.data);
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return { lastNotification };
}