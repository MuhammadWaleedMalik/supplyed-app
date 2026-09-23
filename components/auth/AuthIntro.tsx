import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Button from '../Ui/Button';
import GridBackground from '../Ui/GridBackground';
import { common } from '../Ui/theme';
import AuthSteps from './AuthSteps';
import { introStyles } from './introStyles';
import { loginBenefits } from '../../utils/auth/authUtils';

type Props = {
  register: boolean;
  verify?: boolean;
  wide: boolean;
  onBack: () => void;
  onSwitch: () => void;
};

export default function AuthIntro({
  register,
  verify,
  wide,
  onBack,
  onSwitch,
}: Props) {
  return (
    <View style={[introStyles.panel, wide && introStyles.wide]}>
      <GridBackground />
      <View style={introStyles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={introStyles.brandButton}
        >
          <Text style={introStyles.brand}>
            Supply<Text style={introStyles.blue}>ED</Text>
          </Text>
        </Pressable>
        <Button
          title={verify || register ? 'Log in' : 'Sign up'}
          onPress={onSwitch}
          variant="outline"
          compact
        />
      </View>
      <View style={[introStyles.copy, wide && introStyles.wideCopy]}>
        {verify ? (
          <>
            <Text style={common.eyebrow}>VERIFY EMAIL</Text>
            <Text
              accessibilityRole="header"
              style={[introStyles.heading, introStyles.serifHeading]}
            >
              Confirm the email, then continue setup.
            </Text>
            <Text style={introStyles.body}>
              Verification protects the account before profile, learner, or
              compliance details are collected.
            </Text>
          </>
        ) : register ? (
          <>
            <Text style={common.eyebrow}>CREATE ACCOUNT</Text>
            <Text
              accessibilityRole="header"
              style={[introStyles.heading, introStyles.serifHeading]}
            >
              Start with secure access, then complete onboarding.
            </Text>
            <Text style={introStyles.body}>
              Create your login first. After email verification, SupplyED signs
              you in and checks whether your role and application status are
              complete.
            </Text>
            <AuthSteps />
          </>
        ) : (
          <>
            <Text accessibilityRole="header" style={introStyles.heading}>
              Welcome back to Supply<Text style={introStyles.blue}>ED</Text>
            </Text>
            <Text style={introStyles.body}>
              Log in to access your dashboard, manage jobs, and connect with
              schools or teachers across the UK.
            </Text>
            <View style={introStyles.benefits}>
              {loginBenefits.map(item => (
                <View key={item} style={introStyles.benefit}>
                  <Text style={introStyles.check}>✓</Text>
                  <Text style={introStyles.benefitText}>{item}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    </View>
  );
}
