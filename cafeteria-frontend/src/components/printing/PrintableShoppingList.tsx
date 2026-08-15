import * as React from "react";
import { Box, Stack } from "@mui/material";
import { DateTimeUtils, DaysOfWeek } from "../../DateTimeUtils";
import DailyShoppingList from "./DailyShoppingList";
import SummaryShoppingList from "./SummaryShoppingList";

interface TotalRowProps {
  startDate: string;
  endDate: string;
}

interface ShoppingListProps {
  startDate: string;
  endDate: string;
}

const ShoppingList: React.FC<TotalRowProps> = ({ startDate, endDate }) => {
  let currentDate = startDate;
  const dates: string[] = [];
  while (currentDate <= endDate) {
    if (!DateTimeUtils.dateFallsOnDayOfWeek(currentDate, DaysOfWeek.WEEKENDS)) {
      dates.push(currentDate);
    }
    currentDate = DateTimeUtils.toString(DateTimeUtils.addDays(currentDate, 1));
  }

  return (
    <Stack direction="column" spacing={2}>
      {dates.map((date) => (
        <DailyShoppingList key={date} date={date} />
      ))}
      {startDate !== endDate && (
        <Box sx={{ pageBreakBefore: "always" }}>
          <SummaryShoppingList startDate={startDate} endDate={endDate} />
        </Box>
      )}
    </Stack>
  );
};

const PrintableShoppingList: React.FC<ShoppingListProps> = ({
  startDate,
  endDate,
}) => {
  return (
    <Box sx={{ pageBreakBefore: "always" }}>
      <ShoppingList startDate={startDate} endDate={endDate} />
    </Box>
  );
};

export default PrintableShoppingList;
