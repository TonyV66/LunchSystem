import Meal from "./Meal";
import StudentLunchTime from "./StudentLunchTime";

export default class Student {
  id: number;
  studentId: string;
  name: string;
  lunchTimes: StudentLunchTime[];
}
