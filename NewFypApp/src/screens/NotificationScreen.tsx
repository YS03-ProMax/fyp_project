import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const NotificationScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Notifications page</Text>
    </View>
  );
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
});

export default NotificationScreen;
