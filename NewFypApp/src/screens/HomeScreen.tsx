import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  addDoc,
  serverTimestamp,
  where,
  getDocs,
} from 'firebase/firestore';
import React, {useEffect, useState} from 'react';
import axios from 'axios';
import {
  Image,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {db} from '../../FirebaseConfig.js';
import {showWaterQualityAlert} from '../services/NotificationService';
import Svg, {Circle} from 'react-native-svg';

const SCREEN_WIDTH = Dimensions.get('window').width;

type SensorData = {
  STATES?: string;
  BASIN?: string;
  LOCATION?: string;
  'SMP-DAT'?: string;
  Time?: string;
  WQI?: number;
  CLASS?: string;
  'RIVER STATUS'?: string;
  ' ID STN (2016)'?: string;
  'ID STN BARU'?: string; // Added for compatibility
  DO_SAT?: number;
  DO?: number;
  BOD?: number;
  COD?: number;
  SS?: number;
  pH?: number;
  NH3N?: number;
  TEMP?: number;
};

const PARAMS = [
  {key: 'pH', label: 'pH', min: 0, max: 14},
  {key: 'DO', label: 'DO', min: 0, max: 15},
  {key: 'COD', label: 'COD', min: 0, max: 50},
  {key: 'BOD', label: 'BOD', min: 0, max: 10},
  {key: 'NH3N', label: 'NH3N', min: 0, max: 2},
  {key: 'SS', label: 'SS', min: 0, max: 1000},
];

const saveAlertToFirestore = async (
  latestData: SensorData,
  modalAlert: {param: string; value: number; status: string},
) => {
  try {
    // Check for existing alert
    const alertsRef = collection(db, 'alerts');
    const q = query(
      alertsRef,
      where('stationId', '==', latestData[' ID STN (2016)'] ?? '-'),
      where('param', '==', modalAlert.param),
      where('time', '==', latestData.Time ?? '-'),
    );
    const existing = await getDocs(q);
    if (!existing.empty) {
      console.log('⚠️ Alert already exists, will not save duplicate.');
      return;
    }

    await addDoc(alertsRef, {
      stationId: latestData[' ID STN (2016)'] ?? '-',
      newStationId: latestData['ID STN BARU'] ?? '-',
      location: latestData.LOCATION ?? '-',
      date: latestData['SMP-DAT'] ?? '-',
      time: latestData.Time ?? '-',
      param: modalAlert.param,
      value: modalAlert.value,
      status: modalAlert.status,
      createdAt: serverTimestamp(),
    });
    console.log('✅ Alert saved to Firestore');
  } catch (err) {
    console.error('❌ Failed to save alert:', err);
  }
};

const COLORS = {
  classI: '#2196F3',
  classII: '#4CAF50',
  classIII: '#FFC107',
  classIV: '#FF7043',
  classV: '#D32F2F',
  unknown: '#BDBDBD',
};

function getParamStatusAndColor(paramKey: string, value: number) {
  switch (paramKey) {
    case 'pH':
      if (value > 7.0 && value <= 8.5)
        return {color: COLORS.classI, status: '(Excellent)'};
      if (value >= 6.0 && value <= 7.0)
        return {color: COLORS.classII, status: '(Good)'};
      if (value >= 5.0 && value < 6.0)
        return {color: COLORS.classIII, status: '(Moderate)'};
      if (value < 5.0) return {color: COLORS.classIV, status: '(Poor)'};
      if (value > 8.5) return {color: COLORS.classV, status: '(Very Poor)'};
      return {color: COLORS.unknown, status: 'Unknown'};

    case 'DO':
      if (value > 7) return {color: COLORS.classI, status: '(Excellent)'};
      if (value >= 5 && value <= 7)
        return {color: COLORS.classII, status: '(Good)'};
      if (value >= 3 && value < 5)
        return {color: COLORS.classIII, status: '(Moderate)'};
      if (value >= 1 && value < 3)
        return {color: COLORS.classIV, status: '(Poor)'};
      if (value < 1) return {color: COLORS.classV, status: '(Very Poor)'};
      return {color: COLORS.unknown, status: 'Unknown'};

    case 'COD':
      if (value < 10) return {color: COLORS.classI, status: '(Excellent)'};
      if (value >= 10 && value < 25)
        return {color: COLORS.classII, status: '(Good)'};
      if (value >= 25 && value < 50)
        return {color: COLORS.classIII, status: '(Moderate)'};
      if (value >= 50 && value < 100)
        return {color: COLORS.classIV, status: '(Poor)'};
      if (value >= 100) return {color: COLORS.classV, status: '(Very Poor)'};
      return {color: COLORS.unknown, status: 'Unknown'};

    case 'BOD':
      if (value < 1) return {color: COLORS.classI, status: '(Excellent)'};
      if (value >= 1 && value < 3)
        return {color: COLORS.classII, status: '(Good)'};
      if (value >= 3 && value < 6)
        return {color: COLORS.classIII, status: '(Moderate)'};
      if (value >= 6 && value < 12)
        return {color: COLORS.classIV, status: '(Poor)'};
      if (value >= 12) return {color: COLORS.classV, status: '(Very Poor)'};
      return {color: COLORS.unknown, status: 'Unknown'};

    case 'NH3N':
      if (value < 0.1) return {color: COLORS.classI, status: '(Excellent)'};
      if (value >= 0.1 && value < 0.3)
        return {color: COLORS.classII, status: '(Good)'};
      if (value >= 0.3 && value < 0.9)
        return {color: COLORS.classIII, status: '(Moderate)'};
      if (value >= 0.9 && value < 2.7)
        return {color: COLORS.classIV, status: '(Poor)'};
      if (value >= 2.7) return {color: COLORS.classV, status: '(Very Poor)'};
      return {color: COLORS.unknown, status: 'Unknown'};

    case 'SS':
      if (value < 25) return {color: COLORS.classI, status: '(Excellent)'};
      if (value >= 25 && value < 50)
        return {color: COLORS.classII, status: '(Good)'};
      if (value >= 50 && value < 150)
        return {color: COLORS.classIII, status: '(Moderate)'};
      if (value >= 150 && value < 300)
        return {color: COLORS.classIV, status: '(Poor)'};
      if (value >= 300) return {color: COLORS.classV, status: '(Very Poor)'};
      return {color: COLORS.unknown, status: 'Unknown'};
  }
  return {color: COLORS.unknown, status: 'Unknown'};
}

const HomeScreen = () => {
  const [latestData, setLatestData] = useState<SensorData | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [modalAlert, setModalAlert] = useState<{
    param: string;
    value: number;
    status: string;
  } | null>(null);

  // 🔹 Add prediction states here
  const [prediction, setPrediction] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<string | null>(null);

  const dismissAlert = (paramKey: string) => {
    setDismissedAlerts(prev => [...prev, paramKey]);
  };

  // 🔹 Fetch Firestore sensor data
  useEffect(() => {
    const q = query(
      collection(db, 'sensorData'),
      orderBy('timestamp', 'desc'),
      limit(1),
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      snapshot.forEach(doc => {
        const data = doc.data() as SensorData;
        setLatestData(data);

        // check alerts
        PARAMS.forEach(param => {
          const value = data[param.key as keyof SensorData];
          if (
            typeof value === 'number' &&
            !dismissedAlerts.includes(param.key)
          ) {
            const {status} = getParamStatusAndColor(param.key, value);
            if (status?.includes('Very Poor')) {
              showWaterQualityAlert(param.key, value, status);
              setModalAlert({param: param.key, value, status});
            }
          }
        });
      });
    });

    return () => unsubscribe();
  }, [dismissedAlerts]);

  // 🔹 Fetch prediction whenever latestData changes
  useEffect(() => {
    if (!latestData) return;

    fetch('http://10.0.2.2:5000/predict', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        DO: latestData?.DO ?? 5,
        DO_SAT: latestData?.DO_SAT ?? 80,
        BOD: latestData?.BOD ?? 2,
        COD: latestData?.COD ?? 10,
        SS: latestData?.SS ?? 50,
        pH: latestData?.pH ?? 7,
        NH3N: latestData?.NH3N ?? 0.1,
        TEMP: latestData?.TEMP ?? 25,
      }),
    })
      .then(res => res.json())
      .then(data => {
        console.log('🔹 Prediction API response:', data);
        setPrediction(data.prediction);
        setConfidence(data.confidence);
      })
      .catch(err => console.error('❌ Prediction fetch error:', err));
  }, [latestData]); // refetch when new sensor data comes in

  // refetch when new sensor data comes in

  return (
    <>
      {/* Center Modal Alert */}
      <Modal
        transparent={true}
        visible={modalAlert !== null}
        animationType="fade"
        onRequestClose={() => setModalAlert(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>⚠️ Water Quality Warning</Text>
            <Text style={styles.modalText}>
              Station ID: {latestData?.[' ID STN (2016)'] ?? '-'}
              {'\n'}
              New Station ID: {latestData?.['ID STN BARU'] ?? '-'}
              {'\n'}
              Location: {latestData?.LOCATION ?? '-'}
              {'\n'}
              Date: {latestData?.['SMP-DAT'] ?? '-'}
              {'\n'}
              Time: {latestData?.Time ?? '-'}
            </Text>
            <Text style={styles.modalText}>
              {modalAlert?.param} is critical: {modalAlert?.value.toFixed(2)}{' '}
              {modalAlert?.param === 'pH' ? '' : 'mg/L'}
            </Text>
            <Text style={styles.modalText}>Status: {modalAlert?.status}</Text>
            <TouchableOpacity
              onPress={() => {
                if (modalAlert && latestData) {
                  dismissAlert(modalAlert.param);
                  saveAlertToFirestore(latestData, modalAlert); // ✅ save on dismiss
                }
                setModalAlert(null);
              }}
              style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Dismiss</Text>
            </TouchableOpacity>

            {/* Show unit mg/L except for pH */}
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          {/* River Info */}
          <View style={styles.riverNameBox}>
            <Text style={styles.riverNameText}>
              {latestData?.LOCATION ?? 'Klang River Basin'}
            </Text>
            <Text style={styles.riverSubText}>
              {(latestData?.BASIN ? `${latestData.BASIN} Basin` : '') +
                (latestData?.STATES ? `, ${latestData.STATES}` : '') +
                (latestData?.[' ID STN (2016)']
                  ? `, ${latestData[' ID STN (2016)']}`
                  : '')}
            </Text>
            <Text style={styles.sampledTimeText}>
              Sampled: {latestData?.['SMP-DAT'] ?? '-'} {latestData?.Time ?? ''}
            </Text>
          </View>

          {/* 🔹 Prediction Card inside HomeScreen */}
          <View style={styles.predictionCard}>
            <View style={styles.predictionRow}>
              <View style={{flex: .9}}>
                <Text
                  style={[
                    styles.predictionTitle,
                    {textAlign: 'left', fontSize: 20, marginBottom: 4, marginLeft: 4},
                  ]}>
                  Predicted River Status
                </Text>
                <Text
                  style={[
                    styles.predictionBadge,
                    {
                      fontSize: 18,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      alignSelf: 'flex-start',
                      marginTop: 4,
                      marginLeft: 4
                    },
                    prediction === 'Clean'
                      ? {backgroundColor: '#4CAF50'}
                      : prediction === 'Slightly Polluted'
                      ? {backgroundColor: '#FFC107'}
                      : {backgroundColor: '#D32F2F'},
                  ]}>
                  {prediction ?? 'Loading...'}
                </Text>
              </View>
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: -20,
                }}>
                <Text style={[styles.confidenceLabel, {marginBottom: 2}]}>
                  Confidence:
                </Text>
                <View
                  style={{
                    width: 100,
                    height: 100,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Svg width={100} height={100}>
                    <Circle
                      cx={50}
                      cy={50}
                      r={40}
                      stroke="#e0e0e0"
                      strokeWidth={10}
                      fill="none"
                    />
                    <Circle
                      cx={50}
                      cy={50}
                      r={40}
                      stroke="#2e86de"
                      strokeWidth={10}
                      fill="none"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={
                        2 * Math.PI * 40 * (1 - Number(confidence ?? 0) / 100)
                      }
                      rotation={-90}
                      origin="50,50"
                    />
                  </Svg>
                  <Text
                    style={[
                      styles.confidenceValue,
                      {
                        position: 'absolute',
                        fontSize: 20,
                        width: 100,
                        textAlign: 'center',
                      },
                    ]}>
                    {confidence !== null ? `${confidence}%` : '-'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Parameters Grid */}
          {latestData && (
            <View style={styles.dataBox}>
              <View style={styles.grid}>
                {PARAMS.map(param => {
                  // @ts-ignore
                  const value = latestData[param.key] ?? '-';
                  const fill =
                    typeof value === 'number'
                      ? Math.min(
                          100,
                          Math.max(
                            0,
                            ((value - param.min) / (param.max - param.min)) *
                              100,
                          ),
                        )
                      : 0;

                  const {color, status} =
                    typeof value === 'number'
                      ? getParamStatusAndColor(param.key, value)
                      : {color: '#e0e0e0', status: '-'};

                  return (
                    <View style={styles.paramBox} key={param.key}>
                      <Text style={styles.paramTitle}>{param.label}</Text>
                      <View style={styles.statusContainer}>
                        <Text style={styles.statusLabel}>Status: </Text>
                        <Text style={[styles.statusValue, {color}]}>
                          {status}
                        </Text>
                      </View>
                      <View style={styles.valueContainer}>
                        <Text style={styles.paramValue}>
                          {typeof value === 'number' ? value.toFixed(2) : '-'}
                          {param.key !== 'pH' && typeof value === 'number'
                            ? ' mg/L'
                            : ''}
                        </Text>
                        <View style={styles.progressBarContainer}>
                          <View
                            style={[
                              styles.progressBar,
                              {width: `${fill}%`, backgroundColor: color},
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  predictionRow: {
  flexDirection: 'row',
  alignItems: 'center',
  width: '100%',
  justifyContent: 'flex-start', // or 'center'
  marginBottom: 2,
},
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 1, // Reduce top margin to move grid up
  },
  predictionBadge: {
    paddingHorizontal: 5,
    paddingVertical: 5,
    borderRadius: 20,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
  },
  confidenceLabel: {
    fontSize: 16,
    marginRight: 8,
  },
  confidenceValue: {
    fontSize: 18, // Bigger font for confidence value
    fontWeight: 'bold',
    color: '#2e86de',
  },
  predictionCard: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 0,
    marginBottom: 0, // Ensure no gap below
    borderRadius: 0,
    shadowColor: 'transparent',
    elevation: 0,
    alignItems: 'center',
  },
  predictionTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
    paddingBottom: 32, // Add this line for extra space at the bottom
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    width: '100%',
    backgroundColor: '#fff',
  },
  riverNameBox: {
    width: '100%',
    height: 130,
    backgroundColor: '#00BFFF',
    borderRadius: 0,
    padding: 15,
    marginBottom: 0, // Remove gap above predictionCard
    alignItems: 'center',
    elevation: 0,
    borderWidth: 0,
    marginTop: 0,
    alignSelf: 'stretch',
  },
  riverNameText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  riverSubText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 5,
    textAlign: 'center',
  },
  sampledTimeText: {
    fontSize: 18,
    color: '#fff',
    marginTop: 5,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  dataBox: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 0,
    paddingVertical: 0, // Remove vertical padding
    paddingHorizontal: 0,
    marginBottom: 0,
    alignItems: 'center',
    elevation: 0,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  paramBox: {
    width: '47%',
    height: 130,
    marginVertical: 6, // Reduce vertical margin for tighter fit
    marginHorizontal: 4,
    backgroundColor: '#fff',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  paramTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
    marginBottom: 2,
    height: 28,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  valueContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  paramValue: {
    fontSize: 25,
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  // 🔹 Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#D32F2F',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
});

export default HomeScreen;