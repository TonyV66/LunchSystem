export enum Role {
  ADMIN,
  TEACHER,
  PARENT,
  CAFETERIA,
  STAFF,
  PRINCIPAL,
  KITCHEN,
}

export const isFactsUserRole = (role: Role): boolean =>
  role === Role.PARENT || role === Role.TEACHER || role === Role.STAFF;

export const isSystemAdminRole = (role: Role): boolean =>
  !(role === Role.PARENT || role === Role.TEACHER || role === Role.STAFF);

export enum AccountStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  PENDING = "pending",
}

const ROLE_NAMES: string[] = ["System Admin.", "Teacher", "Parent", "Cafeteria", "Staff", "Principal", "Kitchen"];

export const getRoleName = (role: Role) => {
  return ROLE_NAMES[role];
}

export const NULL_USER: User = {
  id: 0,
  userName: '',
  pwd: '',
  name: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  notificationReviewDate: new Date('2020-01-01 00:00:00').toJSON(),
  resetPwd: false,
  forgotPwdUri: null,
  forgotPwdDate: null,
}

export default interface User {
  id: number;
  userName: string;
  pwd: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notificationReviewDate: string;
  resetPwd: boolean;
  forgotPwdUri: string | null;
  forgotPwdDate: string | null;
}
