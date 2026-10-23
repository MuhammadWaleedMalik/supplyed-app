import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users } from 'lucide-react-native';
import { useAdminUsers } from '../../feature/dashboard/admin/hooks/useAdminUsers';
import Button from '../Ui/Button';
import Checkbox from '../Ui/Checkbox';
import Input from '../Ui/Input';
import ChoiceField from './ChoiceField';
import SettingsCardHeader from './SettingsCardHeader';
import { useSettingsStyles } from './settingsStyles';
import { useStyles } from './dashboardStyles';

export default function AdminUsersPanel() {
  const settingsStyles = useSettingsStyles();
  const styles = useStyles();
  const [editing, setEditing] = useState(false);

  const form = useAdminUsers();
  const disabled = form.loading || form.busy;

  return (
    <View style={settingsStyles.section}>
      <View style={settingsStyles.card}>
        <SettingsCardHeader
          icon={Users}
          title="USERS"
          note="Manage user phone numbers and verification."
        />
        <View pointerEvents={disabled ? 'none' : 'auto'}>
          <ChoiceField
            label="PHONE VERIFICATION"
            value={form.phoneFilter}
            options={['All', 'Verified', 'Not verified']}
            onChange={form.changeFilter}
          />
        </View>
        <View style={settingsStyles.row}>
          <Button
            title={form.loading ? 'Loading...' : 'Refresh users'}
            variant="social"
            disabled={disabled}
            onPress={form.refresh}
          />
          <Button
            title="Create a user"
            variant="link"
            disabled={disabled}
            onPress={() => {
              form.newUser();
              setEditing(true);
            }}
          />
        </View>
        <Text style={settingsStyles.cardNote}>
          {form.total} users · Page {form.page}
        </Text>
        {form.error ? (
          <Text accessibilityRole="alert" style={settingsStyles.error}>
            {form.error}
          </Text>
        ) : null}
        {!form.loading && !form.error && !form.users.length ? (
          <Text style={settingsStyles.cardNote}>
            No users match this filter.
          </Text>
        ) : null}
        {form.users.map(user => (
          <View key={user.id} style={settingsStyles.record}>
            <Text style={settingsStyles.recordValue}>
              {user.name || user.email}
            </Text>
            <Text style={settingsStyles.cardNote}>
              {user.email} · {user.role}
            </Text>
            <Text style={settingsStyles.recordValue}>
              {user.phone || 'No phone number'}
            </Text>
            <Text
              style={
                user.phoneVerified
                  ? settingsStyles.success
                  : settingsStyles.cardNote
              }
            >
              {user.phoneVerified ? 'Phone verified' : 'Phone not verified'}
            </Text>
            <Button
              title="Edit user"
              variant="link"
              compact
              disabled={disabled}
              onPress={() => {
                form.selectUser(user);
                setEditing(true);
              }}
            />
          </View>
        ))}
        <View style={settingsStyles.row}>
          <Button
            title="Previous page"
            variant="social"
            disabled={disabled || form.page === 1}
            onPress={form.previousPage}
          />
          <Button
            title="Next page"
            variant="social"
            disabled={disabled || !form.hasNextPage}
            onPress={form.nextPage}
          />
        </View>
      </View>
      <Modal
        visible={editing}
        animationType="slide"
        onRequestClose={() => {
          if (!form.busy) setEditing(false);
        }}
      >
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            style={styles.scroll}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.detailHeader}>
              <Button
                title="Back to users"
                variant="link"
                disabled={form.busy}
                onPress={() => setEditing(false)}
              />
            </View>
            <ScrollView
              contentContainerStyle={styles.page}
              keyboardShouldPersistTaps="handled"
            >
              <View style={settingsStyles.card}>
                <SettingsCardHeader
                  icon={Users}
                  title={form.selectedUser ? 'EDIT USER' : 'CREATE USER'}
                  note={
                    form.selectedUser
                      ? form.selectedUser.email
                      : 'Create an instructor or institution account.'
                  }
                />
                <View
                  pointerEvents={form.busy ? 'none' : 'auto'}
                  style={settingsStyles.section}
                >
                  <Input
                    label="NAME"
                    value={form.fields.name}
                    required={false}
                    maxLength={200}
                    disabled={form.busy}
                    onChangeText={value => form.change('name', value)}
                  />
                  <Input
                    label="EMAIL"
                    email
                    value={form.fields.email}
                    disabled={form.busy || Boolean(form.selectedUser)}
                    onChangeText={value => form.change('email', value)}
                  />
                  {form.selectedUser ? (
                    <Text style={settingsStyles.cardNote}>
                      Role: {form.selectedUser.role}
                    </Text>
                  ) : (
                    <>
                      <Input
                        label="PASSWORD"
                        password
                        value={form.fields.password}
                        disabled={form.busy}
                        onChangeText={value => form.change('password', value)}
                      />
                      <Text style={settingsStyles.cardNote}>
                        Use at least 8 characters, an uppercase letter, a number
                        and a special character.
                      </Text>
                      <ChoiceField
                        label="ACCOUNT TYPE"
                        value={
                          form.fields.role === 'INSTRUCTOR'
                            ? 'Instructor'
                            : 'Institution'
                        }
                        options={['Instructor', 'Institution']}
                        onChange={value =>
                          form.change(
                            'role',
                            value === 'Instructor'
                              ? 'INSTRUCTOR'
                              : 'INSTITUTION',
                          )
                        }
                      />
                    </>
                  )}
                  <Input
                    label="PHONE"
                    placeholder="Include the country code, e.g. +44"
                    required={false}
                    value={form.fields.phone}
                    maxLength={30}
                    disabled={form.busy}
                    onChangeText={value => form.change('phone', value)}
                  />
                  <Checkbox
                    label="Email verified"
                    checked={form.fields.emailVerified}
                    onChange={value => form.change('emailVerified', value)}
                  />
                  <Checkbox
                    label="Phone verified"
                    checked={form.fields.phoneVerified}
                    onChange={value => form.change('phoneVerified', value)}
                  />
                  <Text style={settingsStyles.cardNote}>
                    Changing the number clears phone verification. Check Phone
                    verified only after verifying the new number.
                  </Text>
                </View>
                {form.error ? (
                  <Text style={settingsStyles.error}>{form.error}</Text>
                ) : null}
                {form.notice ? (
                  <Text style={settingsStyles.success}>{form.notice}</Text>
                ) : null}
                <Button
                  title={
                    form.busy
                      ? 'Saving...'
                      : form.selectedUser
                      ? 'Save user'
                      : 'Create user'
                  }
                  disabled={disabled}
                  onPress={form.save}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
