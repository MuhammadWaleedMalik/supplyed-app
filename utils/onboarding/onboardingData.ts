export type AccountType = 'school' | 'teacher' | 'individual';
export type OnboardingData = {
  fullName: string;
  phone: string;
  country: string;
  city: string;
  postcode: string;
  schoolName: string;
  schoolRole: string;
  domain: string;
  registrationId: string;
  address: string;
  pupilCount: string;
  staffingNeeds: string;
  complianceLead: string;
  complianceEmail: string;
  confirmed: boolean;
  subjects: string;
  keyStages: string;
  skills: string;
  experience: string;
  dailyRate: string;
  hourlyRate: string;
  currency: string;
  travelDistance: string;
  trn: string;
  bio: string;
};

export const initialData: OnboardingData = {
  fullName: '',
  phone: '',
  country: 'United Kingdom',
  city: '',
  postcode: '',
  schoolName: '',
  schoolRole: '',
  domain: '',
  registrationId: '',
  address: '',
  pupilCount: '',
  staffingNeeds: '',
  complianceLead: '',
  complianceEmail: '',
  confirmed: false,
  subjects: '',
  keyStages: '',
  skills: '',
  experience: '',
  dailyRate: '',
  hourlyRate: '',
  currency: 'GBP',
  travelDistance: '',
  trn: '',
  bio: '',
};

export const accountTypes: {
  id: AccountType;
  symbol: string;
  title: string;
  description: string;
}[] = [
  {
    id: 'school',
    symbol: '▦',
    title: 'School / MAT',
    description: 'Post roles, review ranked matches, and manage compliance.',
  },
  {
    id: 'teacher',
    symbol: '♙',
    title: 'Supply teacher',
    description: 'Build your profile, find roles, and manage availability.',
  },
  {
    id: 'individual',
    symbol: '♡',
    title: 'Individual hirer',
    description:
      'Find verified teachers for yourself, your child, or another learner.',
  },
];

export const countries = ['United Kingdom', 'Pakistan', 'Egypt', 'Other'];
export const cities = [
  'Greater Manchester',
  'Lancashire',
  'London',
  'Birmingham',
  'Other',
];
export const staffingNeeds = [
  'Urgent cover',
  'Planned cover',
  'Learner support',
  'All of these',
];
export const subjects = [
  'English',
  'Maths',
  'Science',
  'Primary',
  'SEN',
  'Other',
];
export const keyStages = ['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5'];
export const skills = [
  'SEN support',
  'Classroom management',
  'Phonics',
  'Exam preparation',
];
export const currencies = ['GBP', 'EUR', 'USD'];

export const schoolSteps = [
  ['Choose role', 'Select how you want to use SupplyED'],
  ['School details', 'Organisation, cover needs, and authority'],
  ['Compliance', 'Safeguarding contact and approval details'],
  ['Full review', 'Review everything before creating the profile'],
];
export const teacherSteps = [
  [
    'Teacher profile',
    'Contact details, subjects, rates, travel, and teaching style',
  ],
  ['Full review', 'Review everything before creating the profile'],
];
export const individualSteps = [
  ['Profile details', 'Create your hiring profile with basic contact details'],
  ['Full review', 'Review everything before creating the profile'],
];
