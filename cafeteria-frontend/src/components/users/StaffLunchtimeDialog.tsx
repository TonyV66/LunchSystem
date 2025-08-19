import React, { useContext, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import LunchtimeSelector from "../shoppingcart/LunchtimeSelector";
import { DayOfWeek } from "../../models/DayOfWeek";

interface Props {
  dayOfWeek: DayOfWeek;
  onClose: (selectedTime?: string) => void;
}

const StaffLunchtimeDialog: React.FC<Props> = ({ dayOfWeek, onClose }) => {
  const { currentSchoolYear } = useContext(AppContext);

  const [selectedTime, setSelectedTime] = useState<string>();

  return (
    <Dialog
      open={true}
      onClose={() => onClose(undefined)}
      fullWidth={true}
      maxWidth="xs"
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle>Select Lunchtime</DialogTitle>
      <DialogContent>
        <Box pt={1}>
          <LunchtimeSelector
            selectedTime={selectedTime}
            schoolYear={currentSchoolYear}
            dayOfWeek={dayOfWeek}
            onTimeSelected={(time) => setSelectedTime(time)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={() => onClose(undefined)}>
          Cancel
        </Button>
        <Button
          disabled={!selectedTime}
          variant="contained"
          onClick={() => onClose(selectedTime)}
        >
          Ok
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StaffLunchtimeDialog;
