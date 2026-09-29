import React from 'react';
import { View } from 'react-native';
import type { JobForm } from '../../feature/dashboard/shared/apis/jobsApi';
import FlowProgress from './FlowProgress';
import JobDetailsStep from './JobDetailsStep';
import JobModeStep from './JobModeStep';
import JobRequirementsStep from './JobRequirementsStep';
import { jobStyles } from './jobStyles';

type Props = {
  step: number;
  form: JobForm;
  error: string;
  loading: boolean;
  onMode: (value: string) => void;
  onChange: (name: keyof JobForm, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  onSave: () => void;
};

export default function JobPostingFlow(props: Props) {
  const titles = [
    'Choose how to hire',
    'Tell teachers about the role',
    'Set teacher requirements',
  ];

  return (
    <View style={jobStyles.wizard}>
      <FlowProgress
        step={props.step}
        title={titles[props.step - 1]}
        onClose={props.onClose}
      />

      {props.step === 1 ? <JobModeStep onSelect={props.onMode} /> : null}

      {props.step === 2 ? (
        <JobDetailsStep
          form={props.form}
          error={props.error}
          onChange={props.onChange}
          onBack={props.onBack}
          onNext={props.onNext}
        />
      ) : null}

      {props.step === 3 ? (
        <JobRequirementsStep
          form={props.form}
          error={props.error}
          loading={props.loading}
          onChange={props.onChange}
          onBack={props.onBack}
          onSave={props.onSave}
        />
      ) : null}
    </View>
  );
}
