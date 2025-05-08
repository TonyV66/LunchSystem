import React, { KeyboardEvent, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Paper,
  Typography,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import Checkbox from "@mui/material/Checkbox";
import { DateTimeUtils } from "../../DateTimeUtils";
import { Dayjs } from "dayjs";
import { DayOfWeek } from "../../models/DailyLunchTime";

interface SelectedTimesListProps {
  availTimes: string[];
  selectedTimes: string[];
  onSelectedTimesChanged?: (selectedTimes: string[]) => void;
}

const TimesList: React.FC<SelectedTimesListProps> = ({
  availTimes,
  selectedTimes,
}) => {
  const [checked, setChecked] = React.useState<string[]>(selectedTimes);

  const handleToggle = (
    event: React.ChangeEvent<HTMLInputElement>,
    time: string
  ) => {
    if (event.target.checked) {
      setChecked(checked.concat(time));
    } else {
      setChecked(checked.filter((ti) => ti !== time));
    }
  };

  return (
    <Paper sx={{ p: 1, display: "flex", flexDirection: "column" }}>
      {availTimes.map((value) => {
        return (
          <FormControlLabel
            key={value}
            control={
              <Checkbox
                sx={{ paddingTop: "5px", paddingBottom: "5px" }}
                size="small"
                onChange={(event) => handleToggle(event, value)}
                checked={checked.includes(value)}
              />
            }
            label={DateTimeUtils.toTwelveHourTime(value)}
          />
        );
      })}
    </Paper>
  );
};

interface SelectedDaysListProps {
  selectedDays: DayOfWeek[];
  onSelectedDaysChanged?: (selectedDays: DayOfWeek[]) => void;
}

const DaysList: React.FC<SelectedDaysListProps> = ({ selectedDays }) => {
  const [checked, setChecked] = React.useState<DayOfWeek[]>(selectedDays);

  const handleToggle = (
    event: React.ChangeEvent<HTMLInputElement>,
    day: DayOfWeek
  ) => {
    if (event.target.checked) {
      setChecked(checked.concat(day));
    } else {
      setChecked(checked.filter((day) => day !== day));
    }
  };

  return (
    <Paper sx={{ p: 1, display: "flex", flexDirection: "column" }}>
      <FormControlLabel
        control={
          <Checkbox
            sx={{ paddingTop: "5px", paddingBottom: "5px" }}
            size="small"
            onChange={(event) => handleToggle(event, DayOfWeek.MONDAY)}
            checked={checked.includes(DayOfWeek.MONDAY)}
          />
        }
        label="Monday"
      />
      <FormControlLabel
        control={
          <Checkbox
            sx={{ paddingTop: "5px", paddingBottom: "5px" }}
            size="small"
            onChange={(event) => handleToggle(event, DayOfWeek.TUESDAY)}
            checked={checked.includes(DayOfWeek.TUESDAY)}
          />
        }
        label="Tuesday"
      />
      <FormControlLabel
        control={
          <Checkbox
            sx={{ paddingTop: "5px", paddingBottom: "5px" }}
            size="small"
            onChange={(event) => handleToggle(event, DayOfWeek.WEDNESDAY)}
            checked={checked.includes(DayOfWeek.WEDNESDAY)}
          />
        }
        label="Wednesday"
      />
      <FormControlLabel
        control={
          <Checkbox
            sx={{ paddingTop: "5px", paddingBottom: "5px" }}
            size="small"
            onChange={(event) => handleToggle(event, DayOfWeek.THURSDAY)}
            checked={checked.includes(DayOfWeek.THURSDAY)}
          />
        }
        label="Thursday"
      />
      <FormControlLabel
        control={
          <Checkbox
            sx={{ paddingTop: "5px", paddingBottom: "5px" }}
            size="small"
            onChange={(event) => handleToggle(event, DayOfWeek.FRIDAY)}
            checked={checked.includes(DayOfWeek.FRIDAY)}
          />
        }
        label="Friday"
      />
    </Paper>
  );
};

interface DialogProps {
  title?: string;
  okLabel?: string;
  cancelLabel?: string;
  onClose: (selectedDays: DayOfWeek[], selectedTimes: string[]) => void;
}

const DailyLunchTimesDialog: React.FC<DialogProps> = ({
  title,
  onClose,
  okLabel,
  cancelLabel,
}) => {
  const [newTime, setNewTime] = React.useState<Dayjs | null>(null);
  const [availTimes, setAvailtTimes] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);

  const handleTimeChanged = (time: Dayjs | null) => {
    console.log(time);
    setNewTime(time);
  };

  const handleKeyPressed = async (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && newTime !== null && newTime.isValid()) {
      const timeString = newTime.format("HH:mm");
      if (!availTimes.includes(timeString)) {
        setAvailtTimes(availTimes.concat(timeString).sort());
      }
    }
  };

  return (
    <Dialog
      open={true}
      onClose={() => onClose([], [])}
      maxWidth="sm"
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle>{title ?? "Lunch Times"}</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            pt: 1,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "auto auto 1fr",
            columnGap: 2,
          }}
        >
          <Box>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <TimePicker
                slotProps={{ textField: { onKeyUp: handleKeyPressed } }}
                label="Add A Start Time"
                value={newTime}
                onChange={handleTimeChanged}
              />
            </LocalizationProvider>
            <Typography display="block" variant="caption">
              * Enter time & press return
            </Typography>
          </Box>
          <Box></Box>
          <Typography mt={2} fontWeight="bold" variant="body2">
            Lunch Period Start Times
          </Typography>
          <Typography mt={2} fontWeight="bold" variant="body2">
            Days Of Week
          </Typography>
          <TimesList
            availTimes={availTimes}
            selectedTimes={selectedTimes}
            onSelectedTimesChanged={setSelectedTimes}
          />
          <DaysList
            selectedDays={selectedDays}
            onSelectedDaysChanged={setSelectedDays}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={() => onClose([], [])}>
          {cancelLabel ?? "Cancel"}
        </Button>
        <Button
          variant="contained"
          disabled={!selectedDays.length || !selectedTimes.length}
          onClick={() => onClose(selectedDays, selectedTimes)}
        >
          {okLabel ?? "OK"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DailyLunchTimesDialog;
