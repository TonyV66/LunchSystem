import React, { useState } from "react";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { DateTimeUtils } from "../DateTimeUtils";

const ALL_TIMES = [
  "00:00",
  "00:30",
  "01:00",
  "01:30",
  "02:00",
  "02:30",
  "03:00",
  "03:30",
  "04:00",
  "04:30",
  "05:00",
  "05:30",
  "06:00",
  "06:30",
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
  "23:00",
  "23:30",
];

const PlainSelector: React.FC<{
  label: string;
  time: string;
  availTimes?: string[];
  labelId?: string;
  onTimeChanged: (time: string) => void;
}> = ({ time, onTimeChanged, label, labelId, availTimes }) => {
  const [selectedTime, setSelectedTime] = useState(time);

  function handleTimeChanged(value: string): void {
    setSelectedTime(value);
    onTimeChanged(value);
  }

  return (
    <Select
      labelId={labelId}
      variant="standard"
      value={selectedTime}
      label={label}
      onChange={(event: SelectChangeEvent) =>
        handleTimeChanged(event.target.value)
      }
      sx={{ width: "100px" }}
    >
      {(availTimes ?? ALL_TIMES).sort().map((time) => (
        <MenuItem key={time} value={time}>
          {DateTimeUtils.toTwelveHourTime(time)}
        </MenuItem>
      ))}
    </Select>
  );
};

const TimeSelector: React.FC<{
  label: string;
  time: string;
  wrapInFormControl?: boolean;
  availTimes?: string[];
  onTimeChanged: (time: string) => void;
}> = ({ time, onTimeChanged, label, wrapInFormControl, availTimes }) => {
  const labelId = label.toLowerCase().split(" ").join("-") + "-label";
  return wrapInFormControl ? (
    <FormControl>
      <InputLabel id={labelId}>{label}</InputLabel>
      <PlainSelector
        time={time}
        label={label}
        labelId={labelId}
        availTimes={(availTimes)}
        onTimeChanged={onTimeChanged}
      />
    </FormControl>
  ) : (
    <PlainSelector
      time={time}
      label={label}
      labelId={labelId}
      onTimeChanged={onTimeChanged}
    />
  );
};

export default TimeSelector;
