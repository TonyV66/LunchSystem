import DailyLunchTime from "./DailyLunchTime";

export enum Role {
  ADMIN,
  TEACHER,
  PARENT,
  CAFETERIA,
}

export const ROLE_NAMES: string[] = ["System Admin.", "Teacher", "Parent", "Cafeteria Worker"];

export const NULL_USER: User = {
  id: 0,
  userName: '',
  pwd: '',
  name: '',
  description: '',
  role: Role.PARENT,
  notificationReviewDate: new Date('2020-01-01 00:00:00').toJSON(),
  lunchTimes: [],
}

export default interface User {
  id: number;
  userName: string;
  pwd: string;
  name: string;
  description: string;
  role: Role;
  notificationReviewDate: string;
  lunchTimes: DailyLunchTime[];
}
