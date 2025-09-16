import {collection, onSnapshot, orderBy, query} from 'firebase/firestore';
import React, {useEffect, useState} from 'react';
import {
  FlatList,
  ImageBackground,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const {db} = require('../../FirebaseConfig');

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
  params?: Record<string, {value: number | null; status: string}>;
  createdAt?: any;
}

export default function NotificationsScreen() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'alerts' | 'sensorData'>('alerts');
  const [sensorDataItems, setSensorDataItems] = useState<any[]>([]);

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

  useEffect(() => {
    const q = query(collection(db, 'sensorData'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSensorDataItems(data);
    });
    return () => unsubscribe();
  }, []);

  return (
    <ImageBackground
      source={require('../utils/heartpatrick_kuala_lumpur_river_of_life_masjid_jamek03.jpg')}
      style={styles.background}
      resizeMode="cover">
      {/* Top Bar */}
      <View
        style={{
          flexDirection: 'row',
          marginBottom: 16,
          marginTop: 12,
          marginHorizontal: 8,
          backgroundColor: '#fff', // white background
          borderRadius: 8,
        }}>
        {/* Water Quality Data (left) */}
        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 14,
            alignItems: 'center',
            borderBottomWidth: activeTab === 'sensorData' ? 3 : 1,
            borderBottomColor:
              activeTab === 'sensorData' ? '#3f7fe0' : '#e0e0e0',
            backgroundColor: activeTab === 'sensorData' ? '#eaf2ff' : '#fff', // blue shade when selected
            borderTopLeftRadius: 8,
            borderBottomLeftRadius: 8,
          }}
          onPress={() => setActiveTab('sensorData')}>
          <Text
            style={{
              color: activeTab === 'sensorData' ? '#3f7fe0' : '#222',
              fontWeight: 'bold',
              fontSize: 16,
              letterSpacing: 1,
            }}>
            Water Quality Data
          </Text>
        </TouchableOpacity>
        {/* Alerts (right) */}
        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 14,
            alignItems: 'center',
            borderBottomWidth: activeTab === 'alerts' ? 3 : 1,
            borderBottomColor: activeTab === 'alerts' ? '#3f7fe0' : '#e0e0e0',
            backgroundColor: activeTab === 'alerts' ? '#eaf2ff' : '#fff', // blue shade when selected
            borderTopRightRadius: 8,
            borderBottomRightRadius: 8,
          }}
          onPress={() => setActiveTab('alerts')}>
          <Text
            style={{
              color: activeTab === 'alerts' ? '#3f7fe0' : '#222',
              fontWeight: 'bold',
              fontSize: 16,
              letterSpacing: 1,
            }}>
            Alerts
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content Rendering */}
      {activeTab === 'alerts' ? (
        <FlatList
          data={alerts}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <TouchableOpacity
              onPress={() => {
                setSelectedAlert(item);
                setModalVisible(true);
              }}>
              <View style={styles.card}>
                <Text style={styles.title}>
                  Location: {item.location || 'Unknown Location'}
                </Text>
                <Text style={styles.subtitleSmall}>
                  Date: {item.date} | Time: {item.time}
                </Text>
                <Text
                  style={{
                    color: '#f12424', // red for alerts only
                    fontWeight: 'bold',
                    fontSize: 18,
                    marginBottom: 6,
                  }}>
                  Parameter: {item.param} | Value: {item.value}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={sensorDataItems}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <TouchableOpacity
              onPress={() => {
                setSelectedAlert(item);
                setModalVisible(true);
              }}>
              <View style={styles.card}>
                <Text style={styles.title}>
                  Location: {item.LOCATION || 'Unknown Location'}
                </Text>
                <Text style={styles.subtitleSmall}>
                  Date: {item['SMP-DAT']} | Time: {item.Time}
                </Text>
                {/* Parameter line for normal data is NOT red */}
                {/* You can add more summary fields here if needed */}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Place your modal here */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.3)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 24,
              width: '90%',
              maxHeight: '80%',
            }}>
            <ScrollView>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: 'bold',
                  marginBottom: 8,
                  color: '#000',
                }}>
                Water Quality Status Details
              </Text>
              {selectedAlert && (
                <View>
                  <Text style={{color: '#000', fontWeight: 'bold'}}>
                    Location:{' '}
                    {selectedAlert.location || selectedAlert.LOCATION || '-'}
                  </Text>
                  <Text style={{color: '#000', fontWeight: 'bold'}}>
                    Station ID:{' '}
                    {selectedAlert.stationId ||
                      selectedAlert[' ID STN (2016)'] ||
                      '-'}
                  </Text>
                  <Text style={{color: '#000', fontWeight: 'bold'}}>
                    New Station ID:{' '}
                    {selectedAlert.newStationId ||
                      selectedAlert['ID STN BARU'] ||
                      '-'}
                  </Text>
                  <Text style={{color: '#000', fontWeight: 'bold'}}>
                    Date:{' '}
                    {selectedAlert.date || selectedAlert['SMP-DAT'] || '-'}
                  </Text>
                  <Text style={{color: '#000', fontWeight: 'bold'}}>
                    Time: {selectedAlert.time || selectedAlert.Time || '-'}
                  </Text>
                  <Text style={{color: '#000', fontWeight: 'bold'}}>
                    Predicted River Quality Status:{' '}
                    {selectedAlert.predictedStatus ||
                      selectedAlert.prediction ||
                      selectedAlert['RIVER STATUS'] ||
                      '-'}
                  </Text>
                  <Text
                    style={{marginTop: 12, fontWeight: 'bold', color: '#000'}}>
                    All Parameters:
                  </Text>
                  {selectedAlert.params
                    ? Object.entries(selectedAlert.params).map(
                        ([key, {value, status}]) => (
                          <Text
                            key={key}
                            style={{
                              color:
                                status === '(Very Poor)' ? '#f12424' : '#000',
                              fontWeight: 'bold',
                              marginBottom: 2,
                            }}>
                            {key}: {value} {status}
                          </Text>
                        ),
                      )
                    : Object.entries(selectedAlert)
                        .filter(([key, val]) => typeof val === 'number')
                        .map(([key, val]) => (
                          <Text
                            key={key}
                            style={{
                              color: '#000',
                              fontWeight: 'bold',
                              marginBottom: 2,
                            }}>
                            {key}: {val}
                          </Text>
                        ))}
                </View>
              )}
              <TouchableOpacity
                style={{
                  marginTop: 24,
                  backgroundColor: '#3f7fe0ff',
                  padding: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                onPress={() => setModalVisible(false)}>
                <Text style={{color: '#fff', fontWeight: 'bold'}}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* End modal */}
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
