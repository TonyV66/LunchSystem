import React, { useEffect } from "react";
import { FormControlLabel, Paper, Typography, Radio } from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import { DateTimeUtils } from "../../DateTimeUtils";

interface TimesListProps {
  availTimes: string[];
  selectedTimes: string[];
  onSelectedTimesChanged: (selectedTimes: string[]) => void;
  isSingleSelect?: boolean;
}

const TimesList: React.FC<TimesListProps> = ({
  availTimes,
  selectedTimes,
  onSelectedTimesChanged,
  isSingleSelect = false,
}) => {
  const [checked, setChecked] = React.useState<string[]>(selectedTimes);

  useEffect(() => {
    setChecked(selectedTimes);
  }, [selectedTimes]);

  const handleToggleCheckbox = (
    event: React.ChangeEvent<HTMLInputElement>,
    time: string
  ) => {
    const updatedTimes = event.target.checked
      ? [...checked, time]
      : checked.filter((ti) => ti !== time);
    setChecked(updatedTimes);
    onSelectedTimesChanged(updatedTimes);
  };
  const handleToggleRadio = (time: string) => {
    const updatedTimes = checked.includes(time) ? [] : [time];
    setChecked(updatedTimes);
    onSelectedTimesChanged(updatedTimes);
  };

  return (
    <Paper
      sx={{
        minWidth: "120px",
        pt: 1,
        pb: 1,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {availTimes.length === 0 ? (
        <Typography sx={{ px: 2, py: 1 }} variant="body2" color="text.secondary">
          None
        </Typography>
      ) : (
        availTimes.sort().map((value) => {
          return (
            <FormControlLabel
              sx={{ marginRight: "0px", marginLeft: "0px" }}
              key={value}
              control={
                isSingleSelect ? (
                  <Radio
                    sx={{ paddingTop: "5px", paddingBottom: "5px" }}
                    size="small"
                    onClick={() => handleToggleRadio(value)}
                    checked={checked.includes(value)}
                  />
                ) : (
                  <Checkbox
                    sx={{ paddingTop: "5px", paddingBottom: "5px" }}
                    size="small"
                    onChange={(event) => handleToggleCheckbox(event, value)}
                    checked={checked.includes(value)}
                  />
                )
              }
              label={
                <Typography sx={{ textWrap: "nowrap" }} variant="body2">
                  {DateTimeUtils.toTwelveHourTime(value)}
                </Typography>
              }
            />
          );
        })
      )}
    </Paper>
  );
};

export default TimesList;
