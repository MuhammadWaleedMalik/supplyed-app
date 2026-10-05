import React from 'react';
import { Text, View } from 'react-native';
import { Users } from 'lucide-react-native';
import { useAdminUsers } from '../../feature/dashboard/admin/hooks/useAdminUsers';
import Button from '../Ui/Button';
import Checkbox from '../Ui/Checkbox';
import Input from '../Ui/Input';
import ChoiceField from './ChoiceField';
import SettingsCardHeader from './SettingsCardHeader';
import { settingsStyles } from './settingsStyles';

export default function AdminUsersPanel() {
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
            onPress={form.newUser}
          />
        </View>
        <Text style={settingsStyles.cardNote}>
          {form.total} users · Page {form.page}
        </Text>
        {!form.loading && !form.users.length ? (
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
              onPress={() => form.selectUser(user)}
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
                    value === 'Instructor' ? 'INSTRUCTOR' : 'INSTITUTION',
                  )
                }
              />
            </>
          )}
          <Input
            label="PHONE"
            phone
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
            Changing the number clears phone verification. Check Phone verified
            only after verifying the new number.
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
    </View>
  );
}
