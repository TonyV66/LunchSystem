import DailyLunchTime from "./DailyLunchTime";

export default class SchoolYear {
  id: number;
  name: string;
  isCurrent: boolean;
  startDate: string;
  endDate: string;
  lunchTimes: DailyLunchTime[];
}
