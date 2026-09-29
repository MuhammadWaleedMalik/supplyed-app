import React from 'react';
import { View } from 'react-native';
import type { Job } from '../../feature/dashboard/shared/apis/jobsApi';
import ApplicationDetailsStep from './ApplicationDetailsStep';
import ApplicationReviewStep from './ApplicationReviewStep';
import FlowProgress from './FlowProgress';
import { jobStyles } from './jobStyles';

type Props = {
  job: Job;
  step: number;
  coverLetter: string;
  error: string;
  loading: boolean;
  onCoverLetter: (value: string) => void;
  onStep: (step: number) => void;
  onReview: () => void;
  onClose: () => void;
  onSubmit: () => void;
};

const titles = ['Application details', 'Review and submit'];

export default function ApplicationWizard(props: Props) {
  function showDetails() {
    props.onStep(1);
  }

  return (
    <View style={jobStyles.wizard}>
      <FlowProgress
        step={props.step}
        title={titles[props.step - 1]}
        onClose={props.onClose}
      />

      {props.step === 1 ? (
        <ApplicationDetailsStep
          job={props.job}
          coverLetter={props.coverLetter}
          onCoverLetter={props.onCoverLetter}
          onNext={props.onReview}
        />
      ) : null}

      {props.step === 2 ? (
        <ApplicationReviewStep
          job={props.job}
          coverLetter={props.coverLetter}
          error={props.error}
          loading={props.loading}
          onBack={showDetails}
          onSubmit={props.onSubmit}
        />
      ) : null}
    </View>
  );
}
