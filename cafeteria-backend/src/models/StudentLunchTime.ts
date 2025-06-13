import { GradeLevel } from "./GradeLevel";
import StudentLunchTimeEntity from "../entity/StudentLunchTimeEntity";

export default class StudentLunchTime {
  studentId: number;
  grade: GradeLevel;
  dayOfWeek: number;
  time?: string;
  teacherId?: number;

  constructor(entity: StudentLunchTimeEntity) {
    this.studentId = entity.student?.id ?? 0;
    this.grade = entity.grade;
    this.dayOfWeek = entity.dayOfWeek;
    this.time = entity.time;
    this.teacherId = entity.lunchtimeTeacher?.id;
  }
}
