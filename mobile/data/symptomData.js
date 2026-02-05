// This file simulates a knowledge base for the AI Symptom Checker.
// In a real application, this logic would be handled by a backend AI/ML service.

export const symptomQuestions = {
  fever: {
    initial: 'What is the child\'s temperature?',
    follow_ups: [
      {
        question: 'How long has the child had a fever?',
        options: ['Less than 24 hours', '1-3 days', 'More than 3 days'],
      },
      {
        question: 'Are there any other major symptoms?',
        options: ['Cough', 'Rash', 'Vomiting', 'None of the above'],
      },
    ],
    analysis: (answers) => {
      const [duration, otherSymptom] = answers;
      if (duration === 'More than 3 days' || otherSymptom === 'Rash') {
        return {
          recommendation: 'See a Doctor',
          urgency: 'medium',
          summary: 'A fever lasting more than 3 days or accompanied by a rash should be evaluated by a doctor.',
        };
      }
      return {
        recommendation: 'Monitor at Home',
        urgency: 'low',
        summary: 'Monitor the fever. Ensure the child stays hydrated. You can use over-the-counter fever reducers as directed.',
      };
    },
  },
  cough: {
    initial: 'What does the cough sound like?',
    follow_ups: [
      {
        question: 'Is the cough wet (with phlegm) or dry?',
        options: ['Wet', 'Dry'],
      },
      {
        question: 'Is the child having difficulty breathing?',
        options: ['Yes, significant difficulty', 'A little, but not severe', 'No'],
      },
    ],
    analysis: (answers) => {
      const [coughType, breathing] = answers;
      if (breathing === 'Yes, significant difficulty') {
        return {
          recommendation: 'Urgent Care Recommended',
          urgency: 'high',
          summary: 'Significant difficulty breathing requires immediate medical attention. Please go to the nearest urgent care or emergency room.',
        };
      }
      if (coughType === 'Wet' && breathing !== 'No') {
        return {
          recommendation: 'See a Doctor',
          urgency: 'medium',
          summary: 'A wet cough, especially with any breathing difficulty, should be checked by a doctor to rule out chest infections.',
        };
      }
      return {
        recommendation: 'Monitor at Home',
        urgency: 'low',
        summary: 'Monitor the cough. A humidifier can help soothe a dry cough. Ensure the child drinks plenty of fluids.',
      };
    },
  },
  rash: {
    initial: 'Where on the body did the rash first appear?',
    follow_ups: [
      {
        question: 'Is the rash accompanied by a fever?',
        options: ['Yes', 'No'],
      },
      {
        question: 'Does the rash seem to be spreading?',
        options: ['Yes, quickly', 'Yes, slowly', 'No'],
      },
    ],
    analysis: (answers) => {
      const [hasFever, isSpreading] = answers;
      if (hasFever === 'Yes' || isSpreading === 'Yes, quickly') {
        return {
          recommendation: 'Urgent Care Recommended',
          urgency: 'high',
          summary: 'A rash accompanied by a fever or that is spreading quickly needs immediate medical evaluation.',
        };
      }
      return {
        recommendation: 'See a Doctor',
        urgency: 'medium',
        summary: 'It is best to have any new rash evaluated by a doctor to determine the cause.',
      };
    },
  },
};
