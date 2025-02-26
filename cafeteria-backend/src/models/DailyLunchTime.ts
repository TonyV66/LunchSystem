export enum DayOfWeek {
  SUNDAY,
  MONDAY,
  TUESDAY,
  WEDNESDAY,
  THURSDAY,
  FRIDAY,
  SATURDAY,
}

export default class DailyLunchTime {
  id: number;
  dayOfWeek: number;
  time: string;
}
