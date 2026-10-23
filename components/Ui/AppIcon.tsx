import React from 'react';
import {
  Briefcase,
  ClipboardList,
  House,
  Mail,
  MessageCircle,
  Users,
  UserCircle,
  Lock,
  Settings,
  LogOut,
  CalendarCheck,
  Eye,
  EyeOff,
  Check,
  Circle,
  Wallet,
  Bell,
  Star,
} from 'lucide-react-native';
import { useTheme } from './theme';

export type AppIconName =
  | 'jobs'
  | 'applications'
  | 'dashboard'
  | 'bookings'
  | 'billing'
  | 'messages'
  | 'teachers'
  | 'profile'
  | 'lock'
  | 'settings'
  | 'logout'
  | 'interview'
  | 'eye'
  | 'eyeOff'
  | 'check'
  | 'circle'
  | 'notifications'
  | 'reviews'
  | 'invitations';

const icons = {
  jobs: Briefcase,
  applications: ClipboardList,
  dashboard: House,
  bookings: CalendarCheck,
  billing: Wallet,
  messages: MessageCircle,
  teachers: Users,
  profile: UserCircle,
  lock: Lock,
  settings: Settings,
  logout: LogOut,
  interview: CalendarCheck,
  eye: Eye,
  eyeOff: EyeOff,
  check: Check,
  circle: Circle,
  notifications: Bell,
  reviews: Star,
  invitations: Mail,
};

type Props = {
  name: AppIconName;
  color?: string;
  size?: number;
};

export default function AppIcon({ name, color, size = 18 }: Props) {
  const { colors } = useTheme();

  const Icon = icons[name];
  return <Icon color={color || colors.muted} size={size} strokeWidth={2.2} />;
}
