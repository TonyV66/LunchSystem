import { DateTimeUtils } from "../DateTimeUtils";
import DailyLunchTimes from "./DailyLunchTimes";
import { GradeLevel } from "./GradeLevel";
import GradeLunchTime from "./GradeLunchTime";
import { StudentLunchTime } from "./StudentLunchTime";
import TeacherLunchTime from "./TeacherLunchTime";

export enum RelativeDateTarget {
  DAY_MEAL_IS_SERVED = 0,
  WEEK_MEAL_IS_SERVED = 1,
}


export default interface SchoolYear {
  id: number;
  name: string;
  isCurrent: boolean;
  startDate: string;
  endDate: string;
  lunchTimes: DailyLunchTimes[]
  teacherLunchTimes: TeacherLunchTime[];
  gradeLunchTimes: GradeLunchTime[]
  studentLunchTimes: StudentLunchTime[];
  gradesAssignedByClass: GradeLevel[];
  oneTeacherPerStudent: boolean;
}

const startOfMonth = new Date();
startOfMonth.setDate(1);
startOfMonth.setHours(0, 0, 0, 0);

const endOfMonth = new Date(
  startOfMonth.getFullYear(),
  startOfMonth.getMonth() + 1,
  0
);
endOfMonth.setHours(23, 59, 59, 999);

export const NO_SCHOOL_YEAR: SchoolYear = {
  id: 0,
  name: "No School Year Active",
  isCurrent: true,
  startDate: DateTimeUtils.toString(startOfMonth),
  endDate: DateTimeUtils.toString(endOfMonth),
  lunchTimes: [],
  teacherLunchTimes: [],
  gradeLunchTimes: [],
  studentLunchTimes: [],
  gradesAssignedByClass: [],
  oneTeacherPerStudent: true,
}
