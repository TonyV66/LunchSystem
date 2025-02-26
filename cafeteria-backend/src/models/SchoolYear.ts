import DailyLunchTime from "./DailyLunchTime";

export default class SchoolYear {
  id: number;
  startDate: string;
  endDate: string;
  lunchTimes: DailyLunchTime[];
}
