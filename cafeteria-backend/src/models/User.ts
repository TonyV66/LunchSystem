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
  description: string;
  role: Role;
  notificationReviewDate: Date;
  lunchTimes: DailyLunchTime[];
}
