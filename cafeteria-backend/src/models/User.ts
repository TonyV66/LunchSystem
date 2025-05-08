import DailyLunchTime from "./DailyLunchTime";

export enum Role {
  ADMIN,
  TEACHER,
  PARENT,
  CAFETERIA,
}

export default class User {
  id: number;
  userName: string;
  pwd: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  description: string;
  role: Role;
  notificationReviewDate: Date;
  resetPwd: boolean;
  forgotPwdUri: string | null;
  forgotPwdDate: Date;
}
