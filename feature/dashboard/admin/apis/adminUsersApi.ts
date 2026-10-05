import { endpoints } from '../../../../constants/endpoints';
import { protectedRequest } from '../../../../utils/api/request';
import { User } from '../../../auth/apis/authApi';

export type AdminUser = User & {
  countryCode?: string | null;
  profileStatus?: string | null;
};

export type AdminCreateRole = 'INSTRUCTOR' | 'INSTITUTION';
export type PhoneVerificationFilter = 'All' | 'Verified' | 'Not verified';

export type AdminUserFields = {
  name: string;
  email: string;
  password: string;
  role: AdminCreateRole;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
};

export type AdminUserPage = {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };
};

type AdminUserUpdate = {
  name?: string;
  phone: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
};

function validatePhone(phone: string, verified: boolean) {
  if (verified && !phone) {
    throw new Error('Add a phone number before marking it verified.');
  }
  if (phone.length > 30)
    throw new Error('Phone numbers can contain up to 30 characters.');
}

export function getAdminUsers(
  page = 1,
  phoneVerified: PhoneVerificationFilter = 'All',
) {
  let path = endpoints.users + '?page=' + page + '&limit=20';
  if (phoneVerified !== 'All') {
    path +=
      '&phoneVerified=' + (phoneVerified === 'Verified' ? 'true' : 'false');
  }
  return protectedRequest<AdminUserPage>(path);
}

export function createAdminUser(fields: AdminUserFields) {
  const phone = fields.phone.trim();
  validatePhone(phone, fields.phoneVerified);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
    throw new Error('Enter a valid email address.');
  }
  if (fields.password.length < 8) {
    throw new Error('Use a password with at least eight characters.');
  }
  if (fields.name.trim().length > 200) {
    throw new Error('Names can contain up to 200 characters.');
  }
  return protectedRequest<AdminUser>(endpoints.adminUsers, 'POST', {
    name: fields.name.trim() || undefined,
    email: fields.email.trim().toLowerCase(),
    password: fields.password,
    role: fields.role,
    phone: phone || undefined,
    emailVerified: fields.emailVerified,
    phoneVerified: fields.phoneVerified,
  });
}

export function updateAdminUser(current: AdminUser, fields: AdminUserUpdate) {
  const phone = fields.phone.trim();
  // Changing the number clears verification unless the admin explicitly sets it.
  const phoneVerified =
    fields.phoneVerified ??
    (phone === (current.phone || '') && current.phoneVerified === true);
  validatePhone(phone, phoneVerified);
  return protectedRequest<AdminUser>(
    endpoints.adminUsers + '/' + encodeURIComponent(current.id),
    'PATCH',
    {
      name: fields.name?.trim(),
      phone,
      emailVerified: fields.emailVerified,
      phoneVerified,
    },
  );
}

export function adminUserFields(user?: AdminUser): AdminUserFields {
  return {
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role === 'INSTITUTION' ? 'INSTITUTION' : 'INSTRUCTOR',
    phone: user?.phone || '',
    emailVerified: user?.emailVerified === true,
    phoneVerified: user?.phoneVerified === true,
  };
}
