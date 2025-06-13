import DailyLunchTimes from "./DailyLunchTimes";
import { GradeLevel } from "./GradeLevel";
import GradeLunchTimeEntity from "../entity/GradeLunchTimeEntity";

export default class GradeLunchTime extends DailyLunchTimes {
  grade: GradeLevel;

  constructor(entity: GradeLunchTimeEntity) {
    super();
    this.dayOfWeek = entity.dayOfWeek;
    this.times = entity.time ? entity.time.split("|") : [];
    this.grade = entity.grade;
  }
}
