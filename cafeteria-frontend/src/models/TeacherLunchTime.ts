import DailyLunchTimes from "./DailyLunchTimes";
import { GradeLevel } from "./GradeLevel";

export default interface TeacherLunchTime extends DailyLunchTimes {
  teacherId: number;
  grades: GradeLevel[];
}
