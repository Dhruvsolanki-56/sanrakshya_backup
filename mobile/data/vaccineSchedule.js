// A comprehensive list of recommended vaccines and their schedules.
// In a real app, this would be based on official CDC/WHO guidelines.

export const vaccineSchedule = [
  {
    name: 'Hepatitis B (HepB)',
    doses: [
      { dose: 1, ageMonths: 0 }, // Birth
      { dose: 2, ageMonths: 1 }, // 1-2 months
      { dose: 3, ageMonths: 6 }, // 6-18 months
    ],
    description: 'Protects against Hepatitis B, a serious liver infection.',
  },
  {
    name: 'Rotavirus (RV)',
    doses: [
      { dose: 1, ageMonths: 2 },
      { dose: 2, ageMonths: 4 },
    ],
    description: 'Protects against rotavirus, which causes severe diarrhea, vomiting, fever, and abdominal pain.',
  },
  {
    name: 'Diphtheria, tetanus, & acellular pertussis (DTaP)',
    doses: [
      { dose: 1, ageMonths: 2 },
      { dose: 2, ageMonths: 4 },
      { dose: 3, ageMonths: 6 },
      { dose: 4, ageMonths: 15 }, // 15-18 months
      { dose: 5, ageMonths: 48 }, // 4-6 years
    ],
    description: 'Protects against diphtheria, tetanus, and whooping cough.',
  },
  {
    name: 'Haemophilus influenzae type b (Hib)',
    doses: [
      { dose: 1, ageMonths: 2 },
      { dose: 2, ageMonths: 4 },
      { dose: 3, ageMonths: 12 }, // 12-15 months
    ],
    description: 'Protects against a type of bacteria that can cause serious infections, including meningitis.',
  },
  {
    name: 'Pneumococcal conjugate (PCV13)',
    doses: [
      { dose: 1, ageMonths: 2 },
      { dose: 2, ageMonths: 4 },
      { dose: 3, ageMonths: 6 },
      { dose: 4, ageMonths: 12 }, // 12-15 months
    ],
    description: 'Protects against pneumococcal disease, which can cause ear infections, pneumonia, and meningitis.',
  },
  {
    name: 'Inactivated poliovirus (IPV)',
    doses: [
      { dose: 1, ageMonths: 2 },
      { dose: 2, ageMonths: 4 },
      { dose: 3, ageMonths: 6 }, // 6-18 months
      { dose: 4, ageMonths: 48 }, // 4-6 years
    ],
    description: 'Protects against polio, a disabling and life-threatening disease.',
  },
  {
    name: 'Measles, mumps, rubella (MMR)',
    doses: [
      { dose: 1, ageMonths: 12 }, // 12-15 months
      { dose: 2, ageMonths: 48 }, // 4-6 years
    ],
    description: 'Protects against measles, mumps, and rubella.',
  },
  {
    name: 'Varicella (VAR)',
    doses: [
      { dose: 1, ageMonths: 12 }, // 12-15 months
      { dose: 2, ageMonths: 48 }, // 4-6 years
    ],
    description: 'Protects against chickenpox.',
  },
  {
    name: 'Hepatitis A (HepA)',
    doses: [
      { dose: 1, ageMonths: 12 }, // 12-23 months
      { dose: 2, ageMonths: 18 }, // 6 months after first dose
    ],
    description: 'Protects against Hepatitis A, a contagious liver disease.',
  },
];
