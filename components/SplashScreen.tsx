import React from 'react';
import { Image, StatusBar, StyleSheet, View } from 'react-native';

export default function SplashScreen() {
  return (
    <>
      <StatusBar hidden barStyle="light-content" />
      <View style={styles.container}>
        <Image
          source={require('../public/supplyed.png')}
          resizeMode="cover"
          style={StyleSheet.absoluteFill}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000203',
    flex: 1,
  },
});
