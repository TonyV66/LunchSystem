import React, { useState } from "react";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";

const PlainSelector: React.FC<{
  label: string;
  time: string;
  labelId?: string;
  onTimeChanged: (time: string) => void;
}> = ({ time, onTimeChanged, label, labelId }) => {
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
      <MenuItem value={"00:00"}>12:00 AM</MenuItem>
      <MenuItem value={"00:30"}>12:30 AM</MenuItem>
      <MenuItem value={"01:00"}>1:00 AM</MenuItem>
      <MenuItem value={"01:30"}>1:30 AM</MenuItem>
      <MenuItem value={"02:00"}>2:00 AM</MenuItem>
      <MenuItem value={"02:30"}>2:30 AM</MenuItem>
      <MenuItem value={"03:00"}>3:00 AM</MenuItem>
      <MenuItem value={"03:30"}>3:30 AM</MenuItem>
      <MenuItem value={"04:00"}>4:00 AM</MenuItem>
      <MenuItem value={"04:30"}>4:30 AM</MenuItem>
      <MenuItem value={"05:00"}>5:00 AM</MenuItem>
      <MenuItem value={"05:30"}>5:30 AM</MenuItem>
      <MenuItem value={"06:00"}>6:00 AM</MenuItem>
      <MenuItem value={"06:30"}>6:30 AM</MenuItem>
      <MenuItem value={"07:00"}>7:00 AM</MenuItem>
      <MenuItem value={"07:30"}>7:30 AM</MenuItem>
      <MenuItem value={"08:00"}>8:00 AM</MenuItem>
      <MenuItem value={"08:30"}>8:30 AM</MenuItem>
      <MenuItem value={"09:00"}>9:00 AM</MenuItem>
      <MenuItem value={"09:30"}>9:30 AM</MenuItem>
      <MenuItem value={"10:00"}>10:00 AM</MenuItem>
      <MenuItem value={"10:30"}>10:30 AM</MenuItem>
      <MenuItem value={"11:00"}>11:00 AM</MenuItem>
      <MenuItem value={"11:30"}>11:30 AM</MenuItem>
      <MenuItem value={"12:00"}>12:00 PM</MenuItem>
      <MenuItem value={"12:30"}>12:30 PM</MenuItem>
      <MenuItem value={"13:00"}>1:00 PM</MenuItem>
      <MenuItem value={"13:30"}>1:30 PM</MenuItem>
      <MenuItem value={"14:00"}>2:00 PM</MenuItem>
      <MenuItem value={"14:30"}>2:30 PM</MenuItem>
      <MenuItem value={"15:00"}>3:00 PM</MenuItem>
      <MenuItem value={"15:30"}>3:30 PM</MenuItem>
      <MenuItem value={"16:00"}>4:00 PM</MenuItem>
      <MenuItem value={"16:30"}>4:30 PM</MenuItem>
      <MenuItem value={"17:00"}>5:00 PM</MenuItem>
      <MenuItem value={"17:30"}>5:30 PM</MenuItem>
      <MenuItem value={"18:00"}>6:00 PM</MenuItem>
      <MenuItem value={"18:30"}>6:30 PM</MenuItem>
      <MenuItem value={"19:00"}>7:00 PM</MenuItem>
      <MenuItem value={"19:30"}>7:30 PM</MenuItem>
      <MenuItem value={"20:00"}>8:00 PM</MenuItem>
      <MenuItem value={"20:30"}>8:30 PM</MenuItem>
      <MenuItem value={"21:00"}>9:00 PM</MenuItem>
      <MenuItem value={"21:30"}>9:30 PM</MenuItem>
      <MenuItem value={"22:00"}>10:00 PM</MenuItem>
      <MenuItem value={"22:30"}>10:30 PM</MenuItem>
      <MenuItem value={"23:00"}>11:00 PM</MenuItem>
      <MenuItem value={"23:30"}>11:30 PM</MenuItem>
    </Select>
  );
};

const TimeSelector: React.FC<{
  label: string;
  time: string;
  wrapInFormControl?: boolean;
  onTimeChanged: (time: string) => void;
}> = ({ time, onTimeChanged, label, wrapInFormControl }) => {
  const labelId = label.toLowerCase().split(" ").join("-") + "-label";
  return wrapInFormControl ? (
    <FormControl>
      <InputLabel id={labelId}>{label}</InputLabel>
      <PlainSelector
        time={time}
        label={label}
        labelId={labelId}
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
