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
import {
  RelativeDateCountType,
  RelativeDateTarget,
} from "./SchoolSettingsPanel";
import { AppContext } from "../../AppContextProvider";
import { updateSchoolOrderTimes } from "../../api/CafeteriaClient";

interface RelativeDateTime {
  count: number;
  period: RelativeDateCountType;
  targetDate: RelativeDateTarget;
  time: string;
}

interface OrderingWindowDialogProps {
  open: boolean;
  onClose: () => void;
}

const SaleDate: React.FC<{
  time: RelativeDateTime;
  onTimeChanged: (time: RelativeDateTime) => void;
}> = ({ time, onTimeChanged }) => {
  const [relativeDateTime, setRelativeDateTime] =
    useState<RelativeDateTime>(time);

  function handlePeriodChanged(value: string): void {
    const updatedTime = { ...relativeDateTime, period: parseInt(value) };
    setRelativeDateTime(updatedTime);
    onTimeChanged(updatedTime);
  }

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
      <Select
        labelId="what-to-order-label"
        id="what-to-order"
        variant="standard"
        value={relativeDateTime.period.toString()}
        label="Time Period"
        onChange={(event: SelectChangeEvent) =>
          handlePeriodChanged(event.target.value)
        }
      >
        <MenuItem value={RelativeDateCountType.DAYS.toString()}>
          day(s)
        </MenuItem>
        <MenuItem value={RelativeDateCountType.WEEKS.toString()}>
          week(s)
        </MenuItem>
      </Select>
      <Typography>prior to</Typography>
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

const OrderingWindowDialog: React.FC<OrderingWindowDialogProps> = ({
  open,
  onClose,
}) => {
  const { school, setSchool } = useContext(AppContext);
  const [orderStartTime, setOrderStartTime] = useState<RelativeDateTime>({
    count: school.orderStartPeriodCount,
    period: school.orderStartPeriodType as RelativeDateCountType,
    targetDate: school.orderStartRelativeTo as RelativeDateTarget,
    time: school.orderStartTime,
  });
  const [orderEndTime, setOrderEndTime] = useState<RelativeDateTime>({
    count: school.orderEndPeriodCount,
    period: school.orderEndPeriodType as RelativeDateCountType,
    targetDate: school.orderEndRelativeTo as RelativeDateTarget,
    time: school.orderEndTime,
  });

  const handleSave = async () => {
    const updatedSchool: School = {
      ...school,
      orderStartPeriodCount: orderStartTime.count,
      orderStartPeriodType: orderStartTime.period,
      orderStartRelativeTo: orderStartTime.targetDate,
      orderStartTime: orderStartTime.time,
      orderEndPeriodCount: orderEndTime.count,
      orderEndPeriodType: orderEndTime.period,
      orderEndRelativeTo: orderEndTime.targetDate,
      orderEndTime: orderEndTime.time,
    };
    await updateSchoolOrderTimes(updatedSchool);
    setSchool(updatedSchool);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Ordering Window</DialogTitle>
      <DialogContent>
        <Stack direction="column" gap={2} sx={{ mt: 2 }}>
          <Box>
            <Typography variant="caption" fontWeight="bold">
              Start Accepting Orders At:
            </Typography>
            <SaleDate time={orderStartTime} onTimeChanged={setOrderStartTime} />
          </Box>
          <Box>
            <Typography variant="caption" fontWeight="bold">
              Stop Accepting Orders At:
            </Typography>
            <SaleDate time={orderEndTime} onTimeChanged={setOrderEndTime} />
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

export default OrderingWindowDialog;
