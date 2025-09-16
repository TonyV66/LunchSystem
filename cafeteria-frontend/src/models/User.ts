export enum Role {
  ADMIN,
  TEACHER,
  PARENT,
  CAFETERIA,
  STAFF,
  PRINCIPAL,
  KITCHEN,
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
  description: '',
  role: Role.PARENT,
  pending: false,
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
  description: string;
  role: Role;
  pending: boolean;
  notificationReviewDate: string;
  resetPwd: boolean;
  forgotPwdUri: string | null;
  forgotPwdDate: string | null;
}
