import DailyLunchTimes from "./DailyLunchTimes";
import TeacherLunchTimeEntity from "../entity/TeacherLunchTimeEntity";
import { GradeLevel } from "./GradeLevel";

export default class TeacherLunchTime extends DailyLunchTimes {
  teacherId: number;
  grades: GradeLevel[];

  constructor(entity: TeacherLunchTimeEntity) {
    super();
    this.dayOfWeek = entity.dayOfWeek;
    this.times = entity.time ? entity.time.split("|") : [];
    this.teacherId = entity.teacher?.id ?? 0;
    this.grades = entity.grades ? entity.grades.split("|") as GradeLevel[] : [];
  }
}
