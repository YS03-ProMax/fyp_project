import notifee, { AndroidImportance } from '@notifee/react-native';

export async function showWaterQualityAlert(paramName: string, value: number, status: string) {
  await notifee.requestPermission();

  const channelId = await notifee.createChannel({
    id: 'water-quality',
    name: 'Water Quality Alerts',
    importance: AndroidImportance.HIGH,
  });

  

  await notifee.displayNotification({
    title: '⚠️ Water Quality Alert',
    body: `${paramName} level is critical: ${value}`,
    android: {
      channelId,
      importance: AndroidImportance.HIGH,
      pressAction: {
        id: 'default',
      },
    },
  });
}