import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';

const LevelTracker = ({ points, level }) => {
  const pointsForNextLevel = level * 500;
  const progress = points / pointsForNextLevel;

  return (
    <View style={styles.container}>
      <View style={styles.levelContainer}>
        <Text style={styles.levelText}>Level {level}</Text>
        <Ionicons name="star" size={24} color="#ffd700" />
      </View>
      <Progress.Bar 
        progress={progress} 
        width={null} 
        color={'#667eea'}
        unfilledColor={'rgba(102, 126, 234, 0.2)'}
        borderWidth={0}
        height={10}
        style={styles.progressBar}
      />
      <Text style={styles.pointsText}>{points} / {pointsForNextLevel} points</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  levelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  progressBar: {
    borderRadius: 8,
  },
  pointsText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 8,
    textAlign: 'right',
  },
});

export default LevelTracker;
