import * as React from "react";
import { AppContext } from "../../AppContextProvider";
import { DateTimeUtils } from "../../DateTimeUtils";
import PrintableLunchPeriodReport from "./PrintableLunchPeriodReport";

interface AltCafeteriaReportProps {
  date: string;
}

const PrintableDailyLunchPeriods: React.FC<AltCafeteriaReportProps> = ({
  date,
}) => {
  const { currentSchoolYear } =
    React.useContext(AppContext);

  const dayOfWeek = DateTimeUtils.toDate(date).getDay();
  const dailyTimes = currentSchoolYear.lunchTimes.find(
    (lt) => lt.dayOfWeek === dayOfWeek
  );
  const mealTimes = dailyTimes?.times.sort() ?? [];

  return (
    <>
      {/* Hourly meal reports */}
      {mealTimes.map((time) => (
        <PrintableLunchPeriodReport
          key={time}
          date={date}
          time={time}
        />
      ))}
      <PrintableLunchPeriodReport date={date} />
    </>
  );
};

export default PrintableDailyLunchPeriods;
