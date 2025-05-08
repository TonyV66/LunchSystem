import { DayOfWeek } from "./DailyLunchTime";

export default interface TeacherLunchTime {
  dayOfWeek: DayOfWeek;
  time: string;
  teacherId: number;
}
