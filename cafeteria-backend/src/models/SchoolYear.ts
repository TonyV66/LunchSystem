import DailyLunchTimes from "./DailyLunchTimes";
import { GradeLevel } from "./GradeLevel";
import GradeLunchTime from "./GradeLunchTime";
import StudentLunchTime from "./StudentLunchTime";
import TeacherLunchTime from "./TeacherLunchTime";
import SchoolYearEntity from "../entity/SchoolYearEntity";

export enum RelativeDateTarget {
  DAY_MEAL_IS_SERVED = 0,
  WEEK_MEAL_IS_SERVED = 1,
}


export default class SchoolYear {
  id: number;
  name: string;
  isCurrent: boolean;
  startDate: string;
  endDate: string;
  lunchTimes: DailyLunchTimes[];
  teacherLunchTimes: TeacherLunchTime[];
  gradeLunchTimes: GradeLunchTime[];
  studentLunchTimes: StudentLunchTime[];
  gradesAssignedByClass: GradeLevel[];
  oneTeacherPerStudent: boolean;

  constructor(entity: SchoolYearEntity) {
    this.id = entity.id;
    this.name = entity.name;
    this.isCurrent = entity.isCurrent;
    this.startDate = entity.startDate;
    this.endDate = entity.endDate;
    this.lunchTimes =
      entity.lunchTimes?.map((lt) => ({
        dayOfWeek: lt.dayOfWeek,
        times: lt.time ? lt.time.split("|") : [],
      })) ?? [];
    this.teacherLunchTimes =
      entity.teacherLunchTimes?.map((lt) => new TeacherLunchTime(lt)) ?? [];
    this.gradeLunchTimes =
      entity.gradeLunchTimes?.map((lt) => new GradeLunchTime(lt)) ?? [];
    this.studentLunchTimes =
      entity.studentLunchTimes?.map((lt) => new StudentLunchTime(lt)) ?? [];
    this.gradesAssignedByClass = entity.gradesAssignedByClass
      ? (entity.gradesAssignedByClass.split("|") as GradeLevel[])
      : [];
    this.oneTeacherPerStudent = entity.oneTeacherPerStudent;
  }
}
