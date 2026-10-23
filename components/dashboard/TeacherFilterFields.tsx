import React from 'react';
import { Text, View } from 'react-native';
import {
  TeacherFilterErrors,
  TeacherFilters,
} from '../../feature/dashboard/school/apis/teachersApi';
import Input from '../Ui/Input';
import Checkbox from '../Ui/Checkbox';
import DynamicSelect from '../Ui/DynamicSelect';
import { useStyles } from './dashboardStyles';

type Props = {
  filters: TeacherFilters;
  errors: TeacherFilterErrors;
  onChange: <Key extends keyof TeacherFilters>(
    key: Key,
    value: TeacherFilters[Key],
  ) => void;
};

export default function TeacherFilterFields({
  filters,
  errors,
  onChange,
}: Props) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <Text style={styles.cardTitle}>Teaching & location</Text>
      <Input
        label="Subject"
        placeholder="e.g. Mathematics"
        value={filters.subject}
        onChangeText={value => onChange('subject', value)}
        maxLength={100}
        required={false}
        error={errors.subject}
      />
      <Input
        label="Skill"
        placeholder="e.g. SEN"
        value={filters.skill}
        onChangeText={value => onChange('skill', value)}
        maxLength={100}
        required={false}
        error={errors.skill}
      />
      <DynamicSelect
        name="keyStage"
        label="Key stage"
        placeholder="All key stages"
        value={filters.keyStage}
        onChange={value => onChange('keyStage', value)}
      />
      <DynamicSelect
        name="city"
        label="City or town"
        placeholder="Any UK city or town"
        value={filters.city}
        onChange={value => onChange('city', value)}
        error={errors.city}
      />
      <Text style={styles.cardTitle}>Experience & rates</Text>
      <Input
        label="Minimum experience (years)"
        placeholder="Any experience"
        value={filters.minExperience}
        onChangeText={value => onChange('minExperience', value)}
        number
        required={false}
        error={errors.minExperience}
      />
      <DynamicSelect
        name="teacherRating"
        label="Minimum rating"
        placeholder="Any rating"
        value={filters.minRating}
        onChange={value => onChange('minRating', value)}
        error={errors.minRating}
      />
      <Input
        label="Maximum daily rate (GBP)"
        placeholder="Any daily rate"
        value={filters.maxDailyRate}
        onChangeText={value => onChange('maxDailyRate', value)}
        decimal
        required={false}
        error={errors.maxDailyRate}
      />
      <Input
        label="Maximum hourly rate (GBP)"
        placeholder="Any hourly rate"
        value={filters.maxHourlyRate}
        onChangeText={value => onChange('maxHourlyRate', value)}
        decimal
        required={false}
        error={errors.maxHourlyRate}
      />
      <Text style={styles.cardTitle}>Qualifications & availability</Text>
      <Checkbox
        label="DBS verified only"
        checked={filters.dbsVerified}
        onChange={value => onChange('dbsVerified', value)}
      />
      <Checkbox
        label="QTS qualified"
        checked={filters.qtsQualified}
        onChange={value => onChange('qtsQualified', value)}
      />
      <Checkbox
        label="Available today"
        checked={filters.availableToday}
        onChange={value => onChange('availableToday', value)}
      />
    </View>
  );
}
