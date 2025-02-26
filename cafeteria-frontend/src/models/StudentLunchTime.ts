import DailyLunchTime from "./DailyLunchTime";

export interface StudentLunchTime extends DailyLunchTime {
  teacherId?: number;
}