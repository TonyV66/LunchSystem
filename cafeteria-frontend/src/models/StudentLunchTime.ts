import { GradeLevel } from "./GradeLevel";

export interface StudentLunchTime {
  studentId: number;
  grade: GradeLevel;
  dayOfWeek: number;
  time?: string;
  teacherId?: number;
}