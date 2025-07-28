import React, { useContext, useState } from "react";
import { Box, Paper, Stack, Typography, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import ReportingScheduleDialog from "./ReportingScheduleDialog";
import { AppContext } from "../../AppContextProvider";
import { RelativeDateTarget } from "../../models/SchoolYear";

const formatRelativeDateTime = (
  time: string,
  count: number,
  target: RelativeDateTarget
): string => {
  return `${time} ${count} day(s) prior to ${
    target === RelativeDateTarget.DAY_MEAL_IS_SERVED ? "day" : "week"
  } of meal`;
};

const SchoolReportingPanel: React.FC = () => {
  const { school } = useContext(AppContext);
  const [reportingScheduleDialogOpen, setReportingScheduleDialogOpen] = useState(false);

  return (
    <>
      <Stack className="schoolReportingPanel" direction="column">
        <Stack direction="row" justifyContent="space-between" alignItems='center'>
          <Typography fontWeight='bold' variant="body2">Email Report Schedule</Typography>
          <IconButton size="small" color='primary' onClick={() => setReportingScheduleDialogOpen(true)}>
            <EditIcon />
          </IconButton>
        </Stack>
        <Paper sx={{ p: 2 }}>
          <Stack direction="column" gap={2}>
            <Box>
              <Typography variant="caption" fontWeight="bold">
                Send Email Reports At:
              </Typography>
              <Typography>
                {formatRelativeDateTime(
                  school.emailReportStartTime,
                  school.emailReportStartPeriodCount,
                  school.emailReportStartRelativeTo
                )}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Stack>

      <ReportingScheduleDialog
        open={reportingScheduleDialogOpen}
        onClose={() => setReportingScheduleDialogOpen(false)}
      />
    </>
  );
};

export default SchoolReportingPanel; 