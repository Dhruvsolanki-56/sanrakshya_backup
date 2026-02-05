import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ErrorState = ({
  message,
  onRetry,
  fullWidth = false,
  style,
  textStyle,
  iconSize = 18,
}) => {
  if (!message) return null;

  return (
    <View style={[styles.container, fullWidth && styles.fullWidth, style]}>
      <Ionicons
        name="alert-circle"
        size={iconSize}
        color="#d93025"
        style={styles.icon}
      />
      <Text style={[styles.message, textStyle]} numberOfLines={3}>
        {message}
      </Text>
      {onRetry ? (
        <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fdecea',
    borderWidth: 1,
    borderColor: '#fadbd8',
  },
  fullWidth: {
    width: '100%',
  },
  icon: {
    marginRight: 8,
  },
  message: {
    flex: 1,
    color: '#c0392b',
    fontSize: 13,
  },
  retryButton: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#c0392b',
  },
  retryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ErrorState;
