import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AccountType,
  OnboardingData,
} from '../../utils/onboarding/onboardingData';
import {
  accountReview,
  complianceReview,
  schoolReview,
  teacherReview,
} from '../../utils/onboarding/reviewData';
import { getReviewTitle } from '../../utils/onboarding/onboardingText';
import ReviewCard from './ReviewCard';

type Props = {
  type: AccountType;
  email: string;
  data: OnboardingData;
  editStep: (step: number) => void;
};

export default function ReviewContent({ type, email, data, editStep }: Props) {
  return (
    <View style={styles.cards}>
      <ReviewCard
        title={getReviewTitle(type)}
        subtitle="Contact details"
        items={accountReview(type, email, data)}
        onEdit={() => editStep(1)}
      />
      {type === 'school' && (
        <>
          <ReviewCard
            title="School workspace"
            subtitle="Organisation and staffing needs"
            items={schoolReview(data)}
            onEdit={() => editStep(2)}
          />
          <ReviewCard
            title="Compliance"
            subtitle="Safeguarding approval"
            items={complianceReview(data)}
            onEdit={() => editStep(3)}
          />
        </>
      )}
      {type === 'teacher' && (
        <ReviewCard
          title="Teaching profile"
          subtitle="Subjects, rates, and travel"
          items={teacherReview(data)}
          onEdit={() => editStep(1)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cards: { gap: 14 },
});
