import DailyLunchTimes from "./DailyLunchTimes";
import TeacherLunchTimeEntity from "../entity/TeacherLunchTimeEntity";

export default class TeacherLunchTime extends DailyLunchTimes {
  teacherId: number;

  constructor(entity: TeacherLunchTimeEntity) {
    super();
    this.dayOfWeek = entity.dayOfWeek;
    this.times = entity.time ? entity.time.split("|") : [];
    this.teacherId = entity.teacher?.id ?? 0;
  }
}
