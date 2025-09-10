import React, { useEffect, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';

interface Props {
  onFinish: () => void;
}

const LoadingScreen: React.FC<Props> = ({ onFinish }) => {
  const [progress] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start(() => {
      onFinish();
    });
  }, [onFinish, progress]);

  const widthInterpolated = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* 👇 Replace with your actual logo when ready */}
      <Image
        source={require('../utils/WhiteBgLogo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.appName}>AquaSense</Text>

      {/* Loading bar */}
      <View style={styles.barContainer}>
        <Animated.View
          style={[styles.barFill, { width: widthInterpolated }]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0077B6',
    marginBottom: 40,
  },
  barContainer: {
    width: '80%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#0077B6',
  },
});

export default LoadingScreen;
