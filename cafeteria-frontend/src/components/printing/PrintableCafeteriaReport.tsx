import * as React from "react";
import { Box } from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import { DateTimeUtils } from "../../DateTimeUtils";
import PrintableLunchPeriodReport from "./PrintableLunchPeriodReport";
import PrintableDailySummary from "./PrintableDailySummary";

interface AltCafeteriaReportProps {
  date: string;
}


const PrintableCafeteriaReport: React.FC<AltCafeteriaReportProps> = ({
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
    <Box p={2}>
      <PrintableDailySummary
        date={date}
      />

      {/* Hourly meal reports */}
      {mealTimes.map((time) => (
        <PrintableLunchPeriodReport
          key={time}
          date={date}
          time={time}
        />
      ))}
      <PrintableLunchPeriodReport date={date} />
    </Box>
  );
};

export default PrintableCafeteriaReport;
