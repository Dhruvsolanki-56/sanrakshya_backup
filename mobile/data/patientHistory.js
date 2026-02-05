// This file simulates a patient's complete health history for the doctor's dashboard.

export const patientHistory = {
  'Emma': [
    {
      date: '2024-10-06',
      type: 'Appointment',
      title: 'Annual Checkup',
      details: 'Routine examination with Dr. Smith. All vitals normal.',
      icon: 'calendar-outline',
    },
    {
      date: '2024-09-20',
      type: 'Symptom',
      title: 'Fever Logged',
      details: 'Parent reported a fever of 101°F. Monitored at home.',
      icon: 'thermometer-outline',
    },
    {
      date: '2024-09-15',
      type: 'Vaccine',
      title: 'MMR Vaccine (Dose 1)',
      details: 'Administered at the clinic.',
      icon: 'medical-outline',
    },
    {
      date: '2024-08-01',
      type: 'Measurement',
      title: 'Height & Weight',
      details: 'Height: 95cm, Weight: 14kg. Both within the 50-60th percentile.',
      icon: 'stats-chart-outline',
    },
  ],
  'Alex': [],
  'Sophie': [],
};

// This simulates an analytics engine that flags potential issues.
export const clinicalFlags = {
  'Emma': [],
  'Alex': [],
  'Sophie': [
    {
      id: 'flag-1',
      type: 'Growth',
      title: 'Low Weight Trend',
      details: 'Weight has been consistently below the 15th percentile for the last 3 months. Recommend a nutritional consultation.',
      urgency: 'medium',
    },
    {
      id: 'flag-2',
      type: 'Vaccine',
      title: 'Hib Vaccine Overdue',
      details: 'The 3rd dose of the Hib vaccine is 2 months overdue. Recommend scheduling an appointment.',
      urgency: 'high',
    },
  ],
};
