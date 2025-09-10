import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const CalculatorPage: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.titleWrapper}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">Malaysian WQI Calculator</Text>
        </View>
      </View>
      {/* Add your WQI calculator UI here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topBar: {
    width: '100%',
    height: 70,
    backgroundColor: '#5AC8FA',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  titleWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    height: 28,
  },
  title: {
    color: '#fff',
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
    maxWidth: '90%',
  },
});

export default CalculatorPage;
