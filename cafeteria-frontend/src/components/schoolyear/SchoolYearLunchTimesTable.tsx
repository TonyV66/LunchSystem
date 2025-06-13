import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Typography,
  Chip,
  Stack,
  IconButton,
} from "@mui/material";
import { DateTimeUtils } from "../../DateTimeUtils";
import { DayOfWeek } from "../../models/DayOfWeek";
import SchoolYearDailyLunchTimesDialog from "./SchoolYearDailyLunchTimesDialog";
import SchoolYear from "../../models/SchoolYear";
import { Edit } from "@mui/icons-material";
import { isEditable } from "@testing-library/user-event/dist/utils";

interface SchoolLunchTimesProps {
  schoolYear: SchoolYear;
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const SchoolYearLunchTimesTable: React.FC<SchoolLunchTimesProps> = ({
  schoolYear,
}) => {
  const [openLunchTimesDialog, setOpenLunchTimesDialog] = useState<DayOfWeek>();

  const getLunchTimes = (dayOfWeek: DayOfWeek) => {
    const lunchTime = schoolYear.lunchTimes.find(
      (lt) => lt.dayOfWeek === dayOfWeek
    );
    return lunchTime?.times.sort() ?? [];
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableBody>
            {[DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY].map((day) => (
              <TableRow key={day}>
                <TableCell width="100px">
                  <Typography fontWeight="bold">{DAY_NAMES[day]}</Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" gap={1} flexWrap="wrap">
                    {getLunchTimes(day).map((lt) => (
                      <Chip
                        key={day.toString() + ":" + lt.toString()}
                        variant="outlined"
                        size="small"
                        label={DateTimeUtils.toTwelveHourTime(lt)}
                      />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell width="30px">
                  <IconButton
                    edge="start"
                    disabled={!isEditable}
                    color="primary"
                    onClick={() => setOpenLunchTimesDialog(day)}
                  >
                    <Edit />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {openLunchTimesDialog !== undefined && (
        <SchoolYearDailyLunchTimesDialog
          dayOfWeek={openLunchTimesDialog}
          onClose={() => setOpenLunchTimesDialog(undefined)}
          schoolYear={schoolYear}
        />
      )}
    </>
  );
};

export default SchoolYearLunchTimesTable;
