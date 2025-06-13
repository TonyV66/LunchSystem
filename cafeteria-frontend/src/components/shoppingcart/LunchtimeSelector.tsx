import React from "react";
import {
  FormControl,
  InputLabel,
  MenuItem as MuiMenuItem,
  Select,
  Typography,
} from "@mui/material";
import { DateTimeUtils } from "../../DateTimeUtils";
import SchoolYear from "../../models/SchoolYear";

interface LunchtimeSelectorProps {
  selectedTime: string | undefined;
  schoolYear: SchoolYear;
  dayOfWeek: number;
  onTimeSelected: (time: string) => void;
}

const LunchtimeSelector: React.FC<LunchtimeSelectorProps> = ({
  selectedTime,
  schoolYear,
  dayOfWeek,
  onTimeSelected,
}) => {
  return (
    <FormControl id="lunchtime-selector" fullWidth>
      <InputLabel id="lunchtime-label">Lunchtime</InputLabel>
      <Select
        labelId="lunchtime-label"
        id="lunchtime"
        value={selectedTime}
        label="Lunchtime"
        onChange={(e) => onTimeSelected(e.target.value)}
      >
        {!selectedTime ? (
          <MuiMenuItem disabled={true} value="">
            <Typography color="textDisabled">Select a lunchtime</Typography>
          </MuiMenuItem>
        ) : (
          <></>
        )}
        {schoolYear.lunchTimes
          .filter(
            (lt) =>
              lt.dayOfWeek === dayOfWeek
          )
          .flatMap((lt) => lt.times)
          .sort((a, b) => a.localeCompare(b))
          .map((time) => (
            <MuiMenuItem key={time} value={time}>
              {DateTimeUtils.toTwelveHourTime(time)}
            </MuiMenuItem>
          ))}
      </Select>
    </FormControl>
  );
};

export default LunchtimeSelector; 