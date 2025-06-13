import DailyLunchTimes from "./DailyLunchTimes";

export default interface TeacherLunchTime extends DailyLunchTimes {
  teacherId: number;
}
