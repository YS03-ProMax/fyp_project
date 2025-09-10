import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CalculatorPage from './src/screens/CalculatorPage';
import LoadingScreen from './src/screens/LoadingScreen';
import NotificationScreen from './src/screens/NotificationScreen';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState<'home' | 'calculator' | 'notifications'>('home');

  if (isLoading) {
    return <LoadingScreen onFinish={() => setIsLoading(false)} />;
  }

  if (selectedPage === 'home') {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Home page</Text>
        <Icon name="account-heart" size={80} color="#5AC8FA" />
        <View style={styles.bottomBar}>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.bottomButton} onPress={() => setSelectedPage('home')}>
              <Icon name="monitor-dashboard" size={28} color="#007AFF" />
              <Text style={styles.buttonLabel}>Monitor</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomButton} onPress={() => setSelectedPage('notifications')}>
              <Icon name="bell-outline" size={28} color="#888" />
              <Text style={styles.buttonLabel}>Notifications</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomButton} onPress={() => setSelectedPage('calculator')}>
              <Icon name="calculator-variant-outline" size={28} color="#888" />
              <Text style={styles.buttonLabel}>WQI Calculator</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  } else if (selectedPage === 'calculator') {
    return (
      <>
        <CalculatorPage />
        <View style={styles.bottomBar}>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.bottomButton} onPress={() => setSelectedPage('home')}>
              <Icon name="monitor-dashboard" size={28} color="#888" />
              <Text style={styles.buttonLabel}>Monitor</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomButton} onPress={() => setSelectedPage('notifications')}>
              <Icon name="bell-outline" size={28} color="#888" />
              <Text style={styles.buttonLabel}>Notifications</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomButton} onPress={() => setSelectedPage('calculator')}>
              <Icon name="calculator-variant-outline" size={28} color="#007AFF" />
              <Text style={styles.buttonLabel}>WQI Calculator</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  } else {
    // notifications page
    return (
      <>
        <NotificationScreen />
        <View style={styles.bottomBar}>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.bottomButton} onPress={() => setSelectedPage('home')}>
              <Icon name="monitor-dashboard" size={30} color="#888" />
              <Text style={styles.buttonLabel}>Monitor</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomButton} onPress={() => setSelectedPage('notifications')}>
              <Icon name="bell-outline" size={30} color="#007AFF" />
              <Text style={styles.buttonLabel}>Notifications</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomButton} onPress={() => setSelectedPage('calculator')}>
              <Icon name="calculator-variant-outline" size={30} color="#888" />
              <Text style={styles.buttonLabel}>WQI Calculator</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );` `
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 50,
    color: '#333',
  },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 75,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonLabel: {
    fontSize: 15,
    color: '#333',
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
  },
  bottomButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
