import React, { KeyboardEvent, useState, useContext } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import { Dayjs } from "dayjs";
import SchoolYear from "../../models/SchoolYear";
import { saveSchoolYearLunchTimes } from "../../api/CafeteriaClient";
import { AppContext } from "../../AppContextProvider";
import { AxiosError } from "axios";
import TimesList from "./TimesList";
import { DayOfWeek } from "../../models/DayOfWeek";

interface DialogProps {
  schoolYear: SchoolYear;
  dayOfWeek: number;
  onClose: () => void;
}

const SchoolYearDailyLunchTimesDialog: React.FC<DialogProps> = ({
  schoolYear,
  dayOfWeek,
  onClose,
}) => {
  const {
    setSnackbarMsg,
    setSnackbarErrorMsg,
    setShowGlassPane,
    schoolYears,
    setSchoolYears,
  } = useContext(AppContext);
  const [newTime, setNewTime] = React.useState<Dayjs | null>(null);
  const [availTimes, setAvailtTimes] = useState<string[]>(
    Array.from(
      new Set(
        schoolYear.lunchTimes.flatMap((slt) => slt.times)
      )
    ).sort()
  );
  const [selectedTimes, setSelectedTimes] = useState<string[]>(
    schoolYear.lunchTimes.find((lt) => lt.dayOfWeek === dayOfWeek)?.times ?? []
  );

  const getDayName = (day: number): string => {
    switch (day) {
      case DayOfWeek.MONDAY:
        return "Monday";
      case DayOfWeek.TUESDAY:
        return "Tuesday";
      case DayOfWeek.WEDNESDAY:
        return "Wednesday";
      case DayOfWeek.THURSDAY:
        return "Thursday";
      case DayOfWeek.FRIDAY:
        return "Friday";
      default:
        return "Unknown";
    }
  };

  const handleTimeChanged = (time: Dayjs | null) => {
    console.log("time is " + (time === null ? "null" : time.isValid()));
    setNewTime(time);
  };

  const handleKeyPressed = async (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && newTime !== null && newTime.isValid()) {
      const timeString = newTime.format("HH:mm");
      if (!availTimes.includes(timeString)) {
        setAvailtTimes(availTimes.concat(timeString).sort());
      } 
      if (!selectedTimes.includes(timeString)) {
        setSelectedTimes(selectedTimes.concat(timeString));
      }
      setNewTime(null);
    }
  };

  const handleSave = async () => {
    try {
      setShowGlassPane(true);
      const updatedLunchTimes = await saveSchoolYearLunchTimes(
        schoolYear.id.toString(),
        {
          dayOfWeek,
          times: selectedTimes,
        }
      );

      const updatedTimes = [...schoolYear.lunchTimes];
      updatedLunchTimes.forEach((newTime) => {
        const index = updatedTimes.findIndex(
          (lt) =>
            lt.dayOfWeek === newTime.dayOfWeek
        );
        if (index >= 0) {
          updatedTimes[index] = newTime;
        } else {
          updatedTimes.push(newTime);
        }
      });

      setSchoolYears(
        schoolYears.map((sy) =>
          sy.id !== schoolYear.id
            ? schoolYear
            : { ...sy, lunchTimes: updatedTimes }
        )
      );

      setSnackbarMsg("Lunch times saved");

      onClose();
    } catch (error) {
      setShowGlassPane(false);
      const axiosError = error as AxiosError;
      setSnackbarErrorMsg(
        "Error saving lunch times: " +
          (axiosError.response?.data?.toString() ??
            axiosError.response?.statusText ??
            "Unknown server error")
      );

      // TODO: Show error message to user
    }
  };

  return (
    <Dialog
      open={true}
      onClose={() => {}}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle>{getDayName(dayOfWeek) + " Lunch Times"}</DialogTitle>
      <DialogContent>
        <Stack gap={2}>
          <Box mt={1}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <TimePicker
                slotProps={{ textField: { onKeyUp: handleKeyPressed } }}
                label="Add A Start Time"
                value={newTime}
                onChange={handleTimeChanged}
              />
            </LocalizationProvider>
            <Typography display="block" variant="caption">
              * Enter new start time & press return
            </Typography>
          </Box>
          <Box>
            <Typography mt={2} fontWeight="bold" variant="body2">
              Start Times
            </Typography>
            <TimesList
              availTimes={availTimes}
              selectedTimes={selectedTimes}
              onSelectedTimesChanged={setSelectedTimes}
            />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={() => onClose()}>
          Cancel
        </Button>
        <Button disabled={(availTimes.length === 0) || newTime ? true : false} variant="contained" onClick={() => handleSave()}>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SchoolYearDailyLunchTimesDialog;
