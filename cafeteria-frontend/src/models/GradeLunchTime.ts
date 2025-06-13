import DailyLunchTimes from "./DailyLunchTimes";
import { GradeLevel } from "./GradeLevel";

export default interface GradeLunchTime extends DailyLunchTimes {
  grade: GradeLevel;
} 