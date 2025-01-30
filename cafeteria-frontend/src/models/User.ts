export enum Role {
  ADMIN,
  TEACHER,
  PARENT,
  CAFETERIA,
}

export const NULL_USER: User = {
  id: 0,
  userName: '',
  pwd: '',
  name: '',
  description: '',
  role: Role.PARENT,
  mondayLunchTime: '12:00',
  tuesdayLunchTime: '12:00',
  wednesdayLunchTime: '12:00',
  thursdayLunchTime: '12:00',
  fridayLunchTime: '12:00',
  notificationReviewDate: new Date('2020-01-01 00:00:00').toJSON(),
}

export default interface User {
  id: number;
  userName: string;
  pwd: string;
  name: string;
  description: string;
  role: Role;
  mondayLunchTime: string;
  tuesdayLunchTime: string;
  wednesdayLunchTime: string;
  thursdayLunchTime: string;
  fridayLunchTime: string;
  notificationReviewDate: string;
}
