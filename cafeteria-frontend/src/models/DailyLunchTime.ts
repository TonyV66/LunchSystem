export enum DayOfWeek {
  SUNDAY,
  MONDAY,
  TUESDAY,
  WEDNESDAY,
  THURSDAY,
  FRIDAY,
  SATURDAY,
}

export default interface DailyLunchTime {
  id: number;
  dayOfWeek: number;
  time: string;
}