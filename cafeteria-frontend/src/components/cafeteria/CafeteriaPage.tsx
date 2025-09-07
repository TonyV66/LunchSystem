import React, { useEffect } from "react";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import { Print, ChevronLeft, ChevronRight } from "@mui/icons-material";

import PrintableCafeteriaReport from "../printing/PrintableCafeteriaReport";
import CafeteriaReport from "./CafeteriaReport";
import { useReactToPrint } from "react-to-print";
import { useParams, useNavigate } from "react-router-dom";
import { DateTimeFormat, DateTimeUtils } from "../../DateTimeUtils";
import { AppContext } from "../../AppContextProvider";
import { CAFETERIA_URL } from "../../MainAppPanel";

const CafeteriaPage: React.FC = () => {
  const { date } = useParams();
  const reportRef = React.useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef: reportRef });
  const { setInactivityTimeout, scheduledMenus } = React.useContext(AppContext);
  const navigate = useNavigate();

  // Get all dates with scheduled menus, sorted
  const scheduledDates = scheduledMenus.map((menu) => menu.date).sort();

  // Find current date index
  const currentDate = date || DateTimeUtils.toString(new Date());
  const currentIndex = scheduledDates.indexOf(currentDate);

  // Get previous and next dates
  const previousDate =
    currentIndex > 0 ? scheduledDates[currentIndex - 1] : null;
  const nextDate =
    currentIndex < scheduledDates.length - 1
      ? scheduledDates[currentIndex + 1]
      : null;

  const handlePreviousDate = () => {
    if (previousDate) {
      navigate(`${CAFETERIA_URL}/${previousDate}`);
    }
  };

  const handleNextDate = () => {
    if (nextDate) {
      navigate(`${CAFETERIA_URL}/${nextDate}`);
    }
  };

  useEffect(() => {
    setInactivityTimeout(480);
    return () => {
      setInactivityTimeout(30);
    };
  }, []);

  return (
    <Box>
      <Stack pl={2} pr={2} direction="row" alignItems="center">
        <Stack
          flexGrow={1}
          pl={2}
          pr={2}
          direction="row"
          gap={4}
          justifyContent="center"
          alignItems="center"
        >
          <Button
            onClick={handlePreviousDate}
            disabled={!previousDate}
            variant="outlined"
            startIcon={<ChevronLeft />}
          >
            {previousDate
              ? DateTimeUtils.toString(
                  previousDate,
                  DateTimeFormat.SHORT_DAY_OF_WEEK_DESC
                )
              : "No other meals"}
          </Button>
          <Typography fontWeight="bold" fontSize={32} variant="h6">
            {DateTimeUtils.toString(
              currentDate,
              DateTimeFormat.SHORT_DAY_OF_WEEK_DESC
            )}
          </Typography>
          <Button
            onClick={handleNextDate}
            disabled={!nextDate}
            variant="outlined"
            endIcon={<ChevronRight />}
          >
            {nextDate
              ? DateTimeUtils.toString(
                  nextDate,
                  DateTimeFormat.SHORT_DAY_OF_WEEK_DESC
                )
              : "No meals being served"}
          </Button>
        </Stack>
        <IconButton
          onClick={() => reactToPrintFn()}
          size="large"
          color="primary"
        >
          <Print />
        </IconButton>
      </Stack>

      <CafeteriaReport
        date={date || DateTimeUtils.toString(new Date())}
        large={true}
      />
      <Box display="none">
        <Box ref={reportRef}>
          <PrintableCafeteriaReport
            date={date || DateTimeUtils.toString(new Date())}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default CafeteriaPage;
