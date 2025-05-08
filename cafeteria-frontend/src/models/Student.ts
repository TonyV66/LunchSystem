import { GradeLevel } from "./GradeLevel";

export default interface Student {
  id: number;
  name: string;
  grade: GradeLevel | null;
  studentId: string;
}
