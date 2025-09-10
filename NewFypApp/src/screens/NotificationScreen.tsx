import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { FlatList, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { db } from '../../FirebaseConfig';

interface AlertItem {
  id: string;
  stationId: string;
  newStationId: string;
  location: string;
  date: string;
  time: string;
  param: string;
  value: number;
  status: string;
  createdAt?: any; // Firestore timestamp
}

export default function NotificationsScreen() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'alerts'),
      orderBy('createdAt', 'desc'), // latest first
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as AlertItem[];
      setAlerts(data);
    });

    return () => unsubscribe();
  }, []);

  return (
    <ImageBackground
      source={require('../utils/heartpatrick_kuala_lumpur_river_of_life_masjid_jamek03.jpg')}
      style={styles.background}
      resizeMode="cover">
      <View style={styles.overlay}>
        {alerts.length === 0 ? (
          <Text style={styles.noAlertsText}>No alerts at the moment</Text>
        ) : (
          <FlatList
            data={alerts}
            keyExtractor={item => item.id}
            renderItem={({item}) => {
              // Convert Firestore Timestamp -> JS Date -> local time string
              const createdAt = (item as any).createdAt?.toDate?.();
              const localTime = createdAt
                ? createdAt.toLocaleString()
                : item.time || '—';

              return (
                <View style={styles.card}>
                  <Text style={styles.title}>
                    Location: {item.location || 'Unknown Location'}
                  </Text>
                  <Text style={styles.subtitle}>
                    Station ID: {item.stationId}
                  </Text>
                  <Text style={styles.subtitle}>
                    New Station ID: {item.newStationId}
                  </Text>
                  <Text style={styles.subtitle}>
                    {item.param}: {item.value} ({item.status})
                  </Text>
                  <Text style={styles.subtitleSmall}>
                    Date: {item.date} | Time: {item.time}
                  </Text>
                </View>
              );
            }}
          />
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.85)',
    padding: 16,
  },
  noAlertsText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#888',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#3f7fe0ff',
  },
  subtitle: {
    fontSize: 18,
    color: '#f12424ff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitleSmall: {
    fontSize: 18,
    color: '#131212ff',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  time: {
    fontSize: 12,
    color: '#410464ff',
    textAlign: 'right',
  },
});
