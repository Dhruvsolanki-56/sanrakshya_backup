import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { symptomQuestions } from '../../data/symptomData';

const SymptomCheckerScreen = ({ navigation }) => {
  const [step, setStep] = useState('selection'); // selection, questions, result
  const [selectedSymptom, setSelectedSymptom] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleSymptomSelect = (symptom) => {
    setSelectedSymptom(symptom);
    setStep('questions');
  };

  const handleAnswer = (answer) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    const symptomData = symptomQuestions[selectedSymptom];
    if (currentQuestionIndex < symptomData.follow_ups.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      const result = symptomData.analysis(newAnswers);
      setAnalysisResult(result);
      setStep('result');
    }
  };

  const resetChecker = () => {
    setStep('selection');
    setSelectedSymptom(null);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setAnalysisResult(null);
  };

  const renderSelection = () => (
    <View>
      <Text style={styles.title}>What is the primary symptom?</Text>
      {Object.keys(symptomQuestions).map((symptom) => (
        <TouchableOpacity
          key={symptom}
          style={styles.optionButton}
          onPress={() => handleSymptomSelect(symptom)}
        >
          <Text style={styles.optionText}>{symptom.charAt(0).toUpperCase() + symptom.slice(1)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderQuestions = () => {
    const symptomData = symptomQuestions[selectedSymptom];
    const question = symptomData.follow_ups[currentQuestionIndex];

    return (
      <View>
        <Text style={styles.title}>{question.question}</Text>
        {question.options.map((option) => (
          <TouchableOpacity
            key={option}
            style={styles.optionButton}
            onPress={() => handleAnswer(option)}
          >
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderResult = () => (
    <View style={styles.resultContainer}>
      <Text style={styles.resultTitle}>Analysis Complete</Text>
      <View style={[styles.resultCard, getUrgencyStyle(analysisResult.urgency)]}>
        <Text style={styles.recommendation}>{analysisResult.recommendation}</Text>
        <Text style={styles.summary}>{analysisResult.summary}</Text>
      </View>
      <Text style={styles.disclaimer}>
        This is not a medical diagnosis. It is a recommendation based on the provided symptoms. Please consult a healthcare professional for an accurate diagnosis.
      </Text>
      <TouchableOpacity style={styles.resetButton} onPress={resetChecker}>
        <Text style={styles.resetButtonText}>Start Over</Text>
      </TouchableOpacity>
    </View>
  );

  const getUrgencyStyle = (urgency) => {
    switch (urgency) {
      case 'high':
        return styles.highUrgency;
      case 'medium':
        return styles.mediumUrgency;
      default:
        return styles.lowUrgency;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Symptom Checker</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {step === 'selection' && renderSelection()}
        {step === 'questions' && renderQuestions()}
        {step === 'result' && renderResult()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 24,
    textAlign: 'center',
  },
  optionButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  },
  resultContainer: {
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 24,
  },
  resultCard: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    marginBottom: 24,
  },
  lowUrgency: {
    backgroundColor: 'rgba(16, 172, 132, 0.1)',
    borderColor: '#10ac84',
    borderWidth: 2,
  },
  mediumUrgency: {
    backgroundColor: 'rgba(255, 167, 38, 0.1)',
    borderColor: '#ffa726',
    borderWidth: 2,
  },
  highUrgency: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderColor: '#ff6b6b',
    borderWidth: 2,
  },
  recommendation: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  summary: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 24,
  },
  resetButton: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  resetButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});

export default SymptomCheckerScreen;
