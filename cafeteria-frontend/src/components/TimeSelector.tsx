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
  "01:00",
  "02:00",
  "03:00",
  "04:00",
  "05:00",
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
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
