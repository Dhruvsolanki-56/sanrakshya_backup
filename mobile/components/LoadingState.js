import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

const LoadingState = ({
  message = 'Loading...',
  size = 'large',
  color = '#667eea',
  fullScreen = false,
  style,
  textStyle,
}) => {
  return (
    <View style={[fullScreen ? styles.fullScreen : styles.inline, style]}>
      <ActivityIndicator size={size} color={color} />
      {message ? (
        <Text style={[styles.message, textStyle]}>{message}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inline: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginTop: 8,
    color: '#7f8c8d',
    fontSize: 13,
  },
});

export default LoadingState;
