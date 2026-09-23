import React from 'react';
import {
  Briefcase,
  ClipboardList,
  LayoutDashboard,
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
} from 'lucide-react-native';
import { colors } from './theme';

export type AppIconName =
  | 'jobs'
  | 'applications'
  | 'dashboard'
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
  | 'circle';

const icons = {
  jobs: Briefcase,
  applications: ClipboardList,
  dashboard: LayoutDashboard,
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
};

type Props = {
  name: AppIconName;
  color?: string;
  size?: number;
};

export default function AppIcon({ name, color = colors.muted, size = 18 }: Props) {
  const Icon = icons[name];
  return <Icon color={color} size={size} strokeWidth={2.2} />;
}
