import React, { useContext, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  TextField,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import School from "../../models/School";
import TimeSelector from "../TimeSelector";
import { AppContext } from "../../AppContextProvider";
import { updateSchoolEmailReports } from "../../api/CafeteriaClient";
import { RelativeDateTarget } from "../../models/SchoolYear";

interface RelativeDateTime {
  count: number;
  targetDate: RelativeDateTarget;
  time: string;
}

interface ReportingScheduleDialogProps {
  open: boolean;
  onClose: () => void;
}

const SaleDate: React.FC<{
  time: RelativeDateTime;
  onTimeChanged: (time: RelativeDateTime) => void;
}> = ({ time, onTimeChanged }) => {
  const [relativeDateTime, setRelativeDateTime] =
    useState<RelativeDateTime>(time);


  function handleTargetDateChanged(value: string): void {
    const updatedTime = { ...relativeDateTime, targetDate: parseInt(value) };
    setRelativeDateTime(updatedTime);
    onTimeChanged(updatedTime);
  }

  function handleCountChanged(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void {
    const updatedTime = {
      ...relativeDateTime,
      count: parseInt(event.target.value),
    };
    setRelativeDateTime(updatedTime);
    onTimeChanged(updatedTime);
  }

  function handleTimeChanged(value: string): void {
    const updatedTime = { ...relativeDateTime, time: value };
    setRelativeDateTime(updatedTime);
    onTimeChanged(updatedTime);
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        gap: 2,
        alignItems: "center",
      }}
    >
      <Box sx={{ width: "100px" }}>
        <TimeSelector
          label="Target Date"
          time={relativeDateTime.time.toString()}
          onTimeChanged={handleTimeChanged}
        />
      </Box>
      <TextField
        id="outlined-number"
        type="number"
        variant="standard"
        value={relativeDateTime.count.toString()}
        onChange={handleCountChanged}
        slotProps={{
          inputLabel: {
            shrink: true,
          },
        }}
        sx={{ width: "60px" }}
      />
      <Typography>day(s) prior to</Typography>
      <Select
        labelId="what-to-order-label"
        id="what-to-order"
        variant="standard"
        value={relativeDateTime.targetDate.toString()}
        label="Target Date"
        onChange={(event: SelectChangeEvent) =>
          handleTargetDateChanged(event.target.value)
        }
      >
        <MenuItem value={RelativeDateTarget.DAY_MEAL_IS_SERVED.toString()}>
          day
        </MenuItem>
        <MenuItem value={RelativeDateTarget.WEEK_MEAL_IS_SERVED.toString()}>
          week
        </MenuItem>
      </Select>
      <Typography> of meal</Typography>
    </Box>
  );
};

const ReportingScheduleDialog: React.FC<ReportingScheduleDialogProps> = ({
  open,
  onClose,
}) => {
  const { school, setSchool } = useContext(AppContext);
  const [emailReportTime, setEmailReportTime] = useState<RelativeDateTime>({
    count: school.emailReportStartPeriodCount,
    targetDate: school.emailReportStartRelativeTo as RelativeDateTarget,
    time: school.emailReportStartTime,
  });

  const handleSave = async () => {
    const updatedSchool: School = {
      ...school,
      emailReportStartPeriodCount: emailReportTime.count,
      emailReportStartRelativeTo: emailReportTime.targetDate,
      emailReportStartTime: emailReportTime.time,
    };
    await updateSchoolEmailReports(updatedSchool);
    setSchool(updatedSchool);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Email Report Schedule</DialogTitle>
      <DialogContent>
        <Stack direction="column" gap={2} sx={{ mt: 2 }}>
          <Box>
            <Typography variant="caption" fontWeight="bold">
              Send Email Reports At:
            </Typography>
            <SaleDate time={emailReportTime} onTimeChanged={setEmailReportTime} />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportingScheduleDialog; 