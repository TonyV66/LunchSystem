import { StudentLunchTime } from "./StudentLunchTime";

export default interface Student {
  id: number;
  name: string;
  studentId: string;
  lunchTimes: StudentLunchTime[];
}
