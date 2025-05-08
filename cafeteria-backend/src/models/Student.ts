import { GradeLevel } from "./GradeLevel";
import StudentLunchTime from "./StudentLunchTime";

export default class Student {
  id: number;
  studentId: string;
  name: string;
  grade: GradeLevel | null;
}
