import React from 'react';
import { View } from 'react-native';
import type { JobForm } from '../../feature/dashboard/shared/apis/jobsApi';
import FlowProgress from './FlowProgress';
import JobDetailsStep from './JobDetailsStep';
import JobModeStep from './JobModeStep';
import JobReviewStep from './JobReviewStep';
import JobRequirementsStep from './JobRequirementsStep';
import { useJobStyles } from './jobStyles';
import type { JobAddress } from '../../utils/jobs/jobAddress';

type Props = {
  step: number;
  draftOnly?: boolean;
  published?: boolean;
  form: JobForm;
  error: string;
  loading: boolean;
  onMode: (value: string) => void;
  onChange: (name: keyof JobForm, value: string) => void;
  onAddressMode: (mode: 'school' | 'different') => void;
  schoolAddress?: JobAddress;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  onSave: () => void;
};

export default function JobPostingFlow(props: Props) {
  const jobStyles = useJobStyles();

  const titles = [
    'Choose how to hire',
    'Tell teachers about the role',
    'Set teacher requirements',
    'Review and save',
  ];

  return (
    <View style={jobStyles.wizard}>
      <FlowProgress
        total={4}
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
          onAddressMode={props.onAddressMode}
          schoolAddress={props.schoolAddress}
          onBack={props.onBack}
          onNext={props.onNext}
        />
      ) : null}

      {props.step === 3 ? (
        <JobRequirementsStep
          draftOnly={props.draftOnly}
          published={props.published}
          form={props.form}
          error={props.error}
          loading={props.loading}
          onChange={props.onChange}
          onBack={props.onBack}
          onSave={props.onNext}
        />
      ) : null}
      {props.step === 4 ? (
        <JobReviewStep
          form={props.form}
          error={props.error}
          loading={props.loading}
          onSave={props.onSave}
          onBack={props.onBack}
        />
      ) : null}
    </View>
  );
}
