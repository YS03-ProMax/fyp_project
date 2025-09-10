import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
} from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  default as Icon,
  default as Ionicons,
} from 'react-native-vector-icons/Ionicons';
import { db } from '../../FirebaseConfig';
import {
  calcDOsatPercent,
  calculateWQI,
  classifyWQI,
  getWqiStatus
} from '../services/wqi';

const CalculatorPage: React.FC = () => {
  const [parameters, setParameters] = useState({
    bod: '',
    cod: '',
    ph: '',
    NH3N: '',
    DO: '',
    DO_Sat: '',
    SS: '',
    temp: '',
  });
  const [historyVisible, setHistoryVisible] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [doType, setDoType] = useState<'DO' | 'DO_Sat'>('DO');
  const [resultModal, setResultModal] = useState<{
    wqi: number;
    klass: string;
  } | null>(null);

  const handleChange = (key: string, value: string) => {
    const validNumber = /^(\d+\.?\d*|\.\d*)?$/;
    if (value === '' || validNumber.test(value)) {
      setParameters(prev => ({...prev, [key]: value}));
    }
  };

  const clearHistory = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'wqi_records'));
      if (!snapshot.empty) {
        const deletions = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletions);
        console.log('All history documents deleted successfully!');
      } else {
        console.log('No documents to delete.');
      }
    } catch (err) {
      console.error('Error deleting documents:', err);
    }
  };

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const validateInputs = () => {
    const ranges: Record<keyof typeof parameters, [number, number]> = {
      bod: [0, 50],
      cod: [0, 200],
      ph: [0, 14],
      NH3N: [0, 10],
      DO: [0, 100],
      DO_Sat: [0, 150],
      SS: [0, 1000],
      temp: [0, 50],
    };
    for (const [key, val] of Object.entries(parameters)) {
      // Only validate the selected DO type
      if (
        (key === 'DO' && doType === 'DO_Sat') ||
        (key === 'DO_Sat' && doType === 'DO')
      )
        continue;
      // Only require temperature if DO is selected
      if (key === 'temp' && doType !== 'DO') continue;
      if (val.trim() === '' || isNaN(Number(val))) {
        Alert.alert(
          'Invalid Input',
          `Please enter a valid number for ${key.toUpperCase()}.`,
        );
        return false;
      }
      const num = Number(val);
      const [min, max] = ranges[key as keyof typeof parameters];
      if (num < min || num > max) {
        Alert.alert(
          'Out of Range',
          `${key.toUpperCase()} must be between ${min} and ${max} for DOE WQI calculation.`,
        );
        return false;
      }
    }
    return true;
  };

  const handleCalculate = () => {
    if (!validateInputs()) return;
    // Calculate DO_percent if needed
    let DO_percent = 0;
    if (doType === 'DO') {
      DO_percent = calcDOsatPercent(
        Number(parameters.DO),
        Number(parameters.temp),
      );
    } else {
      DO_percent = Number(parameters.DO_Sat);
    }
    const wqi = calculateWQI({
      bod: Number(parameters.bod),
      cod: Number(parameters.cod),
      ph: Number(parameters.ph),
      ammonia: Number(parameters.NH3N),
      do: DO_percent, // always use DO % saturation
      ss: Number(parameters.SS),
    });
    const klass = classifyWQI(wqi);
    const status = getWqiStatus(wqi).status;
    saveWQI({
      DO: Number(parameters.DO),
      Temp: Number(parameters.temp),
      BOD: Number(parameters.bod),
      COD: Number(parameters.cod),
      NH3N: Number(parameters.NH3N),
      SS: Number(parameters.SS),
      pH: Number(parameters.ph),
      DO_percent,
      WQI: wqi,
      Status: status,
      Class: klass,
    });
    setResultModal({wqi, klass});
  };

  const renderInput = (label: string, key: keyof typeof parameters) => (
    <View style={styles.inputGroup} key={key}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.inputBox}
        value={parameters[key]}
        onChangeText={text => handleChange(key, text)}
        keyboardType="numeric"
        placeholder="Enter value"
        placeholderTextColor="#a0c4d6"
      />
    </View>
  );

  type WQIRecord = {
    BOD: number;
    COD: number;
    NH3N: number;
    SS: number;
    DO: number;
    DO_percent: number;
    pH: number;
    Temp: number;
    WQI: number;
    Status: string;
    Class?: string;
    klass?: string;
    timestamp: {seconds: number; nanoseconds: number};
  };

  // Save WQI result
  const saveWQI = async (data: any) => {
    try {
      await addDoc(collection(db, 'wqi_records'), {
        DO: data.DO,
        Temp: data.Temp,
        BOD: data.BOD,
        COD: data.COD,
        NH3N: data.NH3N,
        SS: data.SS,
        pH: data.pH,
        DO_percent: data.DO_percent,
        WQI: data.WQI,
        Status: data.Status,
        Class: data.Class,
        timestamp: new Date(),
      });
      console.log('WQI record saved!');
    } catch (e) {
      console.error('Error adding document: ', e);
    }
  };

  const fetchHistory = async () => {
    try {
      const q = query(
        collection(db, 'wqi_records'),
        orderBy('timestamp', 'desc'),
        limit(10),
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setHistory(data);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const handleClear = () => {
    setParameters({
      bod: '',
      cod: '',
      ph: '',
      NH3N: '',
      DO: '',
      DO_Sat: '',
      SS: '',
      temp: '',
    });
    setResultModal(null);
  };

  type HistoryItem = {
    BOD: number;
    COD: number;
    NH3N: number;
    SS: number;
    DO: number;
    DO_percent: number;
    pH: number;
    Temp: number;
    WQI: number;
    Status: string;
    Class?: string;
    timestamp: {seconds: number; nanoseconds: number};
  };

  const [selectedHistory, setSelectedHistory] = useState<HistoryItem | null>(
    null,
  );

  // Inside your details modal code:
  const detailsAnim = useRef(new Animated.Value(400)).current;
  useEffect(() => {
    if (selectedHistory) {
      Animated.timing(detailsAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(detailsAnim, {
        toValue: 400,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedHistory]);

  return (
    <View style={styles.container}>
      {/* Top Bar with history icon */}
      <View style={styles.topBar}>
        <Text style={styles.title}>AquaSense WQI Calculator</Text>
      </View>

      {/* History Details Modal */}
      {historyVisible && (
        <View style={styles.historyOverlay}>
          <View style={styles.historyModal}>
            {/* Always show the list underneath */}
            <View>
              <Text style={styles.historyTitle}>Calculation History</Text>
              <ScrollView style={{maxHeight: 400, marginTop: 12}}>
                {history.length === 0 ? (
                  <Text style={{textAlign: 'center', color: '#666'}}>
                    No history yet
                  </Text>
                ) : (
                  history.map((h, idx) => (
                    <TouchableOpacity
                      key={h.id}
                      style={styles.historyItem}
                      onPress={() => {
                        if (selectedIds.includes(h.id)) {
                          setSelectedIds(selectedIds.filter(id => id !== h.id));
                        } else {
                          setSelectedIds([...selectedIds, h.id]);
                        }
                      }}>
                      {/* Checkbox */}
                      <View style={styles.checkbox}>
                        {selectedIds.includes(h.id) && (
                          <Ionicons name="checkmark" size={16} color="#e20c0cff" />
                        )}
                      </View>
                      {/* History Info */}
                      <View style={{flex: 1}}>
                        <Text style={styles.historyText}>
                          WQI: {h.WQI.toFixed(2)}
                        </Text>
                        <Text style={styles.historySub}>
                          {new Date(
                            h.timestamp.seconds * 1000,
                          ).toLocaleString()}
                        </Text>
                      </View>
                      {/* Details Arrow */}
                      <TouchableOpacity
                        onPress={() => setSelectedHistory(h)}
                        style={{padding: 4}}>
                        <Ionicons
                          name="chevron-forward-circle"
                          size={24}
                          color="#333"
                        />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
              <TouchableOpacity
                onPress={async () => {
                  // Delete selected items from Firestore
                  const batch = selectedIds.map(id =>
                    deleteDoc(doc(collection(db, 'wqi_records'), id)),
                  );
                  await Promise.all(batch);
                  // Remove from local state
                  setHistory(history.filter(h => !selectedIds.includes(h.id)));
                  setSelectedIds([]);
                }}
                style={[
                  styles.historyClose,
                  {
                    backgroundColor: selectedIds.length ? '#FF3B30' : '#ccc',
                    marginBottom: 8,
                  },
                ]}
                disabled={selectedIds.length === 0}>
                <Text style={{color: '#fff', fontWeight: 'bold'}}>
                  Delete Selected
                </Text>
              </TouchableOpacity>
              <View
                style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <TouchableOpacity
                  onPress={clearHistory}
                  style={[
                    styles.historyClose,
                    {backgroundColor: '#ff3b30', flex: 1, marginRight: 8},
                  ]}>
                  <Text style={{color: '#fff', fontWeight: 'bold'}}>
                    Clear History
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setHistoryVisible(false)}
                  style={[styles.historyClose, {flex: 1}]}>
                  <Text style={{color: '#fff', fontWeight: 'bold'}}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
            {/* Details slide on top */}
            {selectedHistory && (
              <Animated.View
                style={[
                  styles.detailsSlide,
                  {transform: [{translateX: detailsAnim}]},
                ]}>
                <Text style={styles.detailsTitle}>Calculation Details</Text>
                <ScrollView style={{maxHeight: 400, marginTop: 12}}>
                    <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 6}}>BOD: {selectedHistory.BOD}</Text>
                    <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 6}}>COD: {selectedHistory.COD}</Text>
                    <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 6}}>NH3N: {selectedHistory.NH3N}</Text>
                    <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 6}}>SS: {selectedHistory.SS}</Text>
                    <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 6}}>DO: {selectedHistory.DO}</Text>
                    <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 6}}>DO%: {selectedHistory.DO_percent.toFixed(2)}</Text>
                    <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 6}}>pH: {selectedHistory.pH}</Text>
                    <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 6}}>Temp: {selectedHistory.Temp}</Text>
                    <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 6}}>WQI: {selectedHistory.WQI.toFixed(2)}</Text>
                    <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 6}}>Class: {selectedHistory.Class}</Text>
                    <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 6}}>Status: {selectedHistory.Status}</Text>
                  <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 6}}>
                    Timestamp:{' '}
                    {new Date(
                      selectedHistory.timestamp.seconds * 1000,
                    ).toLocaleString()}
                  </Text>
                </ScrollView>
                {/* Bigger Back button */}
                <TouchableOpacity
                  onPress={() => setSelectedHistory(null)}
                  style={styles.backButton}>
                  <Text
                    style={{color: '#fff', fontWeight: 'bold', fontSize: 16}}>
                    ← Back
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </View>
      )}

      {/* Main Inputs */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* Row: Toggle + History Icon */}
        <View style={styles.row}>
          <View style={{flex: 1, alignItems: 'center'}}>
            <Pressable
              style={styles.ovalToggle}
              onPress={() => setDoType(doType === 'DO' ? 'DO_Sat' : 'DO')}>
              <View
                style={[
                  styles.ovalThumb,
                  doType === 'DO_Sat' && styles.ovalThumbRight,
                ]}
              />
              <View style={styles.ovalLabels}>
                <Text
                  style={[
                    styles.ovalLabel,
                    doType === 'DO'
                      ? styles.ovalLabelActive
                      : styles.ovalLabelInactive,
                  ]}>
                  DO
                </Text>
                <Text
                  style={[
                    styles.ovalLabel,
                    doType === 'DO_Sat'
                      ? styles.ovalLabelActive
                      : styles.ovalLabelInactive,
                  ]}>
                  DO% SAT
                </Text>
              </View>
            </Pressable>
          </View>
          {/* History Icon */}
          <TouchableOpacity
            style={{marginLeft: 16}}
            onPress={() => {
              fetchHistory();
              setHistoryVisible(true);
            }}>
            <Icon name="time-outline" size={26} color="black" />
          </TouchableOpacity>
        </View>
        {/* Inputs depending on toggle */}
        {doType === 'DO' ? (
          <>
            {renderInput('Dissolved Oxygen (DO)', 'DO')}
            {renderInput('Temperature (°C)', 'temp')}
          </>
        ) : (
          renderInput('Dissolved Oxygen Saturation (DO_Sat)', 'DO_Sat')
        )}
        {renderInput('Biochemical Oxygen Demand (BOD)', 'bod')}
        {renderInput('Chemical Oxygen Demand (COD)', 'cod')}
        {renderInput('pH Level', 'ph')}
        {renderInput('Ammonium Nitrate (NH3N)', 'NH3N')}
        {renderInput('Suspended Solids (SS)', 'SS')}
        {/* Result Modal */}
        {resultModal && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Water Quality Index</Text>
            <Text style={styles.resultValue}>{resultModal.wqi.toFixed(2)}</Text>
            <Text
              style={[
                styles.resultStatus,
                {color: getWqiStatus(resultModal.wqi).color}, // dynamic color
              ]}>
              Status: {getWqiStatus(resultModal.wqi).status}
            </Text>
            <Text style={styles.resultClass}>Class: {resultModal.klass}</Text>
            <TouchableOpacity
              style={styles.closeResult}
              onPress={() => handleClear()}>
              <Text style={{color: '#fff', fontWeight: 'bold'}}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Calculate button */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.calcButton} onPress={handleCalculate}>
            <Text style={styles.buttonText}>Calculate WQI</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  rowSelected: {
    backgroundColor: '#e6f0ff',
  },
  checkbox: {
  width: 22,
  height: 22,
  borderWidth: 2,
  borderColor: '#007AFF',
  borderRadius: 4,
  marginRight: 12,
  justifyContent: 'center',
  alignItems: 'center',
},
  checkboxSelected: {
    backgroundColor: '#007bff',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },

  detailsTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },

  backButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#8b8484ff',
  },
  detailsSlide: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#020202ff',
    shadowOpacity: 0.2,
    shadowOffset: {width: 0, height: 6},
    zIndex: 101,
  },
  resultStatus: {
    color: '#2e7d32',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 30,
    marginTop: 4,
  },
  resultCard: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 6,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#007AFF',
  },
  resultValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
  },
  resultClass: {
    fontSize: 18,
    fontWeight: '600',
    color: '#444',
  },
  closeResult: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },

  calcButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#007AFF',
    shadowOpacity: 0.2,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 6,
  },

  clearButton: {
    flex: 0.6,
    backgroundColor: '#ccc',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    marginRight: 8,
  },
  clearButtonText: {
    color: '#333',
    fontSize: 25,
    fontWeight: '600',
  },
  historyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  historyModal: {
    backgroundColor: '#fff',
    minHeight: 550,
    borderRadius: 20,
    padding: 20,
    width: '85%',
    shadowColor: '#020202ff',
    shadowOpacity: 0.2,
    shadowOffset: {width: 0, height: 6},
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  historyText: {
    lineHeight: 30,
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  historySub: {
    fontSize: 15,
    color: '#555',
  },
  historyClose: {
    marginTop: 16,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },

  ovalToggleContainer: {
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 8,
  },
  ovalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 200,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#cce7f5',
    position: 'relative',
    paddingHorizontal: 8,
  },
  ovalThumb: {
    position: 'absolute',
    left: 8,
    top: 4,
    width: 90,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    zIndex: 1,
  },
  ovalThumbRight: {
    left: 102,
  },
  ovalLabels: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  ovalLabel: {
    width: 90,
    textAlign: 'center',
    lineHeight: 40,
    fontWeight: 'bold',
    fontSize: 16,
    color: '#007AFF',
  },
  ovalLabelActive: {
    color: '#fff',
  },
  ovalLabelInactive: {
    color: '#007AFF',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 8,
    justifyContent: 'center',
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#cce7f5',
    justifyContent: 'center',
    padding: 3,
    marginRight: 12,
  },
  switchActive: {
    backgroundColor: '#007AFF',
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    elevation: 2,
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
    backgroundColor: '#fff',
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#E6F7FF',
  },
  topBar: {
    height: 50,
    backgroundColor: '#5AC8FA',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 5,
    elevation: 6,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: {width: 0, height: 4},
  },
  title: {
    color: '#000000ff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  content: {
    padding: 20,
    paddingBottom: 75,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
    marginBottom: 6,
  },
  inputBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cce7f5',
    padding: 14,
    fontSize: 16,
    color: '#333',
    shadowColor: '#007AFF',
    shadowOpacity: 0.05,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    marginTop: 30,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOpacity: 0.3,
    shadowOffset: {width: 0, height: 6},
    shadowRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 25,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
});

export default CalculatorPage;
