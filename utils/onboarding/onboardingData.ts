export type AccountType = 'school' | 'teacher';
export type InstitutionChoice = 'Single school' | 'MAT school';

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
  institutionType: InstitutionChoice;
  trustName: string;
  trustCompanyNumber: string;
  address: string;
  pupilCount: string;
  staffingNeeds: string;
  complianceLead: string;
  complianceEmail: string;
  signatoryName: string;
  signatoryEmail: string;
  signatoryJobTitle: string;
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
  institutionType: 'Single school',
  trustName: '',
  trustCompanyNumber: '',
  address: '',
  pupilCount: '',
  staffingNeeds: '',
  complianceLead: '',
  complianceEmail: '',
  signatoryName: '',
  signatoryEmail: '',
  signatoryJobTitle: '',
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
    id: 'teacher',
    symbol: 'T',
    title: 'Supply teacher',
    description: 'Build your profile, find roles, and manage availability.',
  },
  {
    id: 'school',
    symbol: 'S',
    title: 'School / MAT',
    description: 'Post roles, review ranked matches, and manage compliance.',
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
export const institutionTypes: InstitutionChoice[] = ['Single school', 'MAT school'];
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
  ['Profile owner', 'Your contact details for this school account'],
  ['School details', 'Organisation, trust details, cover needs, and address'],
  ['Compliance', 'Safeguarding contact and MAT signatory details'],
  ['Full review', 'Review everything before creating the profile'],
];
export const teacherSteps = [
  [
    'Teacher profile',
    'Contact details, subjects, rates, travel, and teaching style',
  ],
  ['Full review', 'Review everything before creating the profile'],
];
