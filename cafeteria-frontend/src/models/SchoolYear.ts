import DailyLunchTime from "./DailyLunchTime";

export default interface SchoolYear {
  id: number;
  startDate: string;
  endDate: string;
  lunchTimes: DailyLunchTime[];
}
