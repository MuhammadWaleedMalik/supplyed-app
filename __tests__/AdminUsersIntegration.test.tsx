import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import AdminUsersPanel from '../components/dashboard/AdminUsersPanel';
import Button from '../components/Ui/Button';
import Checkbox from '../components/Ui/Checkbox';
import Input from '../components/Ui/Input';
import { endpoints } from '../constants/endpoints';
import {
  AdminUser,
  adminUserFields,
  createAdminUser,
  getAdminUsers,
  updateAdminUser,
} from '../feature/dashboard/admin/apis/adminUsersApi';
import { useAdminUsers } from '../feature/dashboard/admin/hooks/useAdminUsers';
import { protectedRequest } from '../utils/api/request';
import {
  clearTokens,
  getCurrentSessionUser,
  setCurrentSessionUser,
} from '../utils/api/session';

jest.mock('../utils/api/request', () => ({
  ...jest.requireActual('../utils/api/request'),
  protectedRequest: jest.fn(),
}));

const request = protectedRequest as jest.MockedFunction<
  typeof protectedRequest
>;
const user: AdminUser = {
  id: 'user-1',
  email: 'teacher@example.com',
  name: 'Sam Teacher',
  role: 'INSTRUCTOR',
  phone: '+447911123456',
  phoneVerified: true,
  emailVerified: true,
};
const page = {
  users: [user],
  pagination: {
    page: 1,
    limit: 20,
    total: 25,
    totalPages: 2,
    hasNextPage: true,
  },
};
let renderer: ReactTestRenderer | undefined;
let form: ReturnType<typeof useAdminUsers>;

function Harness() {
  form = useAdminUsers();
  return null;
}

beforeEach(() => {
  request.mockReset();
  clearTokens();
});

afterEach(async () => {
  if (renderer) await act(async () => renderer?.unmount());
  renderer = undefined;
});

describe('admin user API contract', () => {
  it('sends both boolean filter values explicitly and omits the all filter', async () => {
    request.mockResolvedValue(page);
    await getAdminUsers(1, 'All');
    await getAdminUsers(2, 'Verified');
    await getAdminUsers(1, 'Not verified');
    expect(request).toHaveBeenNthCalledWith(1, '/users?page=1&limit=20');
    expect(request).toHaveBeenNthCalledWith(
      2,
      '/users?page=2&limit=20&phoneVerified=true',
    );
    expect(request).toHaveBeenNthCalledWith(
      3,
      '/users?page=1&limit=20&phoneVerified=false',
    );
  });

  it('uses the admin-create route with permitted account and phone fields', async () => {
    request.mockResolvedValue(user);
    await createAdminUser({
      ...adminUserFields(),
      name: ' Sam Teacher ',
      email: ' Teacher@Example.com ',
      password: 'Example123!',
      role: 'INSTRUCTOR',
      phone: ' +447911123456 ',
      phoneVerified: true,
      emailVerified: true,
    });
    expect(request).toHaveBeenCalledWith(endpoints.adminUsers, 'POST', {
      name: 'Sam Teacher',
      email: 'teacher@example.com',
      password: 'Example123!',
      role: 'INSTRUCTOR',
      phone: '+447911123456',
      phoneVerified: true,
      emailVerified: true,
    });
  });

  it('clears verification on an edited phone by default', async () => {
    request.mockResolvedValue({
      ...user,
      phone: '+447911111111',
      phoneVerified: false,
    });
    await updateAdminUser(user, { phone: '+447911111111' });
    expect(request).toHaveBeenCalledWith('/users/admin/user-1', 'PATCH', {
      name: undefined,
      phone: '+447911111111',
      emailVerified: undefined,
      phoneVerified: false,
    });
  });

  it('allows explicit admin verification of an edited phone', async () => {
    request.mockResolvedValue({ ...user, phone: '+447911111111' });
    await updateAdminUser(user, {
      phone: '+447911111111',
      phoneVerified: true,
    });
    expect(request).toHaveBeenCalledWith(
      '/users/admin/user-1',
      'PATCH',
      expect.objectContaining({
        phone: '+447911111111',
        phoneVerified: true,
      }),
    );
  });

  it('preserves verification when the phone is unchanged', async () => {
    request.mockResolvedValue(user);
    await updateAdminUser(user, {
      phone: user.phone || '',
      name: 'Updated name',
    });
    expect(request).toHaveBeenCalledWith(
      '/users/admin/user-1',
      'PATCH',
      expect.objectContaining({
        phoneVerified: true,
      }),
    );
  });

  it('blocks marking a missing number verified before any create or update request', () => {
    expect(() =>
      createAdminUser({
        ...adminUserFields(),
        phoneVerified: true,
        email: user.email,
        password: 'Example123!',
      }),
    ).toThrow('Add a phone number before marking it verified.');
    expect(() =>
      updateAdminUser(user, { phone: ' ', phoneVerified: true }),
    ).toThrow('Add a phone number before marking it verified.');
    expect(request).not.toHaveBeenCalled();
  });
});

describe('admin user editing and pagination', () => {
  async function mount() {
    request.mockImplementation(async (path, method, body) => {
      if (method === 'PATCH') return { ...user, ...body };
      return page;
    });
    await act(async () => {
      renderer = create(<Harness />);
    });
  }

  it('clears the selected verification checkbox when phone is edited', async () => {
    await mount();
    await act(async () => form.selectUser(user));
    expect(form.fields.phoneVerified).toBe(true);
    await act(async () => form.change('phone', '+447911111111'));
    expect(form.fields.phoneVerified).toBe(false);
    await act(async () => form.save());
    expect(request).toHaveBeenCalledWith(
      '/users/admin/user-1',
      'PATCH',
      expect.objectContaining({
        phone: '+447911111111',
        phoneVerified: false,
      }),
    );
    expect(form.selectedUser?.phoneVerified).toBe(false);
    expect(form.notice).toBe('User updated.');
  });

  it('requires an explicit checkbox change to verify the edited phone', async () => {
    await mount();
    await act(async () => form.selectUser(user));
    await act(async () => form.change('phone', '+447911111111'));
    await act(async () => form.change('phoneVerified', true));
    await act(async () => form.save());
    expect(request).toHaveBeenCalledWith(
      '/users/admin/user-1',
      'PATCH',
      expect.objectContaining({
        phone: '+447911111111',
        phoneVerified: true,
      }),
    );
  });

  it('preserves the logged-in admin session when editing another user', async () => {
    const admin = { ...user, id: 'admin-1', role: 'ADMIN' };
    setCurrentSessionUser(admin);
    await mount();
    await act(async () => form.selectUser(user));
    await act(async () => form.change('phone', '+447911111111'));
    await act(async () => form.save());
    expect(getCurrentSessionUser()).toEqual(admin);
  });

  it('updates the current session when the admin edits their own account', async () => {
    setCurrentSessionUser(user);
    await mount();
    await act(async () => form.selectUser(user));
    await act(async () => form.change('phone', '+447911111111'));
    await act(async () => form.save());
    expect(getCurrentSessionUser()?.phone).toBe('+447911111111');
    expect(getCurrentSessionUser()?.phoneVerified).toBe(false);
  });

  it('loads the next page and resets to page one when the phone filter changes', async () => {
    await mount();
    await act(async () => form.nextPage());
    expect(form.page).toBe(2);
    expect(request).toHaveBeenLastCalledWith('/users?page=2&limit=20');
    await act(async () => form.changeFilter('Not verified'));
    expect(form.page).toBe(1);
    expect(request).toHaveBeenLastCalledWith(
      '/users?page=1&limit=20&phoneVerified=false',
    );
  });

  it('connects the rendered edit controls to the admin phone update endpoint', async () => {
    request.mockImplementation(async (path, method, body) => {
      if (method === 'PATCH') return { ...user, ...body };
      return page;
    });
    await act(async () => {
      renderer = create(<AdminUsersPanel />);
    });
    const editButton = renderer?.root
      .findAllByType(Button)
      .find(button => button.props.title === 'Edit user');
    await act(async () => editButton?.props.onPress());
    const phoneInput = renderer?.root
      .findAllByType(Input)
      .find(input => input.props.label === 'PHONE');
    await act(async () => phoneInput?.props.onChangeText('+447911111111'));
    const verifiedCheckbox = renderer?.root
      .findAllByType(Checkbox)
      .find(checkbox => checkbox.props.label === 'Phone verified');
    expect(verifiedCheckbox?.props.checked).toBe(false);
    const saveButton = renderer?.root
      .findAllByType(Button)
      .find(button => button.props.title === 'Save user');
    await act(async () => saveButton?.props.onPress());
    expect(request).toHaveBeenCalledWith(
      '/users/admin/user-1',
      'PATCH',
      expect.objectContaining({
        phone: '+447911111111',
        phoneVerified: false,
      }),
    );
  });
});
