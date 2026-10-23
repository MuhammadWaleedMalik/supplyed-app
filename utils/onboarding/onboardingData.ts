export type AccountType = 'school' | 'teacher';

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
  institutionType: string;
  trustName: string;
  trustCompanyNumber: string;
  address: string;
  pupilCount: string;
  staffingNeeds: string;
  coverTypes: string;
  county: string;
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
  bio: string;
};

export const initialData: OnboardingData = {
  fullName: '',
  phone: '',
  country: 'GB',
  city: '',
  postcode: '',
  schoolName: '',
  schoolRole: '',
  domain: '',
  registrationId: '',
  institutionType: '',
  trustName: '',
  trustCompanyNumber: '',
  address: '',
  pupilCount: '',
  staffingNeeds: '',
  coverTypes: '',
  county: '',
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
