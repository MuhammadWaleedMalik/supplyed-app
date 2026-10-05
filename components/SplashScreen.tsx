import React from 'react';
import { ImageBackground, StatusBar, StyleSheet } from 'react-native';

export default function SplashScreen() {
  return (
    <>
      <StatusBar hidden barStyle="light-content" />
      <ImageBackground
        source={require('../public/supplyed.png')}
        resizeMode="cover"
        style={styles.container}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000203',
    flex: 1,
  },
});
