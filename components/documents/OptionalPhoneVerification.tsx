import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { getCurrentUser, User } from '../../feature/auth/apis/authApi';
import PhoneVerificationCard from '../auth/PhoneVerificationCard';

export default function OptionalPhoneVerification() {
  const [user, setUser] = useState<User>();
  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then(result => {
        if (active) setUser(result);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return (
    <View>
      <Text>
        Phone verification is optional. You can send your documents for review
        without it.
      </Text>
      <PhoneVerificationCard user={user} editable onVerified={setUser} />
    </View>
  );
}
