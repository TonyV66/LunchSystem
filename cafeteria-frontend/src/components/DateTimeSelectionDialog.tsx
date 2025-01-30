import React, { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import { DateRange, Range } from "react-date-range";
import { Box } from "@mui/material";
import TimeSelector from "./TimeSelector";
import { DateTimeUtils } from "../DateTimeUtils";

interface DialogProps {
  startDate: Date;
  endDate: Date;
  dateOnly: boolean;
  onOk: (startDate: Date, endDate: Date) => void;
  onCancel: () => void;
}
const DateTimeSelectionDialog: React.FC<DialogProps> = ({
  onCancel,
  onOk,
  startDate,
  endDate,
  dateOnly,
}) => {
  const [selectedDates, setSelectedDates] = useState<Range[]>([
    {
      startDate,
      endDate,
      key: "selection",
    },
  ]);

  const [startTime, setStartTime] = useState(DateTimeUtils.getTime(startDate));
  const [endTime, setEndTime] = useState(DateTimeUtils.getTime(endDate));

  const handleStartTimeChanged = (time: string) => {
    setStartTime(time);
  };

  const handleEndTimeChanged = (time: string) => {
    setEndTime(time);
  };

  return (
    <Dialog
      open={true}
      onClose={onCancel}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogContent sx={{ overflow: "hidden" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "ifr ifr",
            justifyItems: "center",
          }}
        >
          <Box sx={{ gridColumnEnd: "span 2" }}>
            <DateRange
              editableDateInputs={false}
              onChange={(item) => setSelectedDates([item.selection])}
              moveRangeOnFirstSelection={false}
              ranges={selectedDates}
            />
          </Box>
          {!dateOnly ? (
            <>
              <TimeSelector
                time={DateTimeUtils.getTime(selectedDates[0]!.startDate!)}
                label="Start Time"
                wrapInFormControl={true}
                onTimeChanged={handleStartTimeChanged}
              />
              <TimeSelector
                time={DateTimeUtils.getTime(selectedDates[0]!.endDate!)}
                label="End Time"
                wrapInFormControl={true}
                onTimeChanged={handleEndTimeChanged}
              />
            </>
          ) : (
            <></>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
      <Button
          variant="contained"
          onClick={onCancel}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          disabled={!selectedDates[0].startDate || !selectedDates[0].endDate}
          onClick={() =>
            onOk(
              new Date(
                DateTimeUtils.toString(selectedDates[0]!.startDate!) +
                  " " +
                  startTime
              ),
              new Date(
                DateTimeUtils.toString(selectedDates[0]!.endDate!) +
                  " " +
                  endTime
              )
            )
          }
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DateTimeSelectionDialog;
