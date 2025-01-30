import React, { ChangeEvent, useContext, useState } from "react";
import "./App.css";
import {
  Box,
  Button,
  FormControl,
  Input,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from "@mui/material";
import { AppContext } from "./AppContextProvider";
import { updateSystemDefaults } from "./services/AdminClientServices";
import TimeSelector from "./components/TimeSelector";
import SystemDefaults from "./models/SystemDefaults";

export enum RelativeDateCountType {
  DAYS,
  WEEKS,
}

export enum RelativeDateTarget {
  DAY_MEAL_IS_SERVED,
  WEEK_MEAL_IS_SERVED,
}

interface RelativeDateTime {
  count: number;
  period: RelativeDateCountType;
  targetDate: RelativeDateTarget;
  time: string;
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
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
      <Typography>At</Typography>
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
      <Typography>prior to the</Typography>
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
      <Typography> meal is served</Typography>
    </Box>
  );
};

const AdminSettingsPage: React.FC = () => {
  const { systemDefaults, setSystemDefaults } = useContext(AppContext);

  const [orderStartTime, setOrderStartTime] = useState<RelativeDateTime>({
    count: systemDefaults.orderStartPeriodCount,
    period: systemDefaults.orderStartPeriodType as RelativeDateCountType,
    targetDate: systemDefaults.orderStartRelativeTo as RelativeDateTarget,
    time: systemDefaults.orderStartTime,
  });
  const [orderEndTime, setOrderEndTime] = useState<RelativeDateTime>({
    count: systemDefaults.orderEndPeriodCount,
    period: systemDefaults.orderEndPeriodType as RelativeDateCountType,
    targetDate: systemDefaults.orderEndRelativeTo as RelativeDateTarget,
    time: systemDefaults.orderEndTime,
  });
  const [mealPrice, setMealPrice] = useState(
    systemDefaults.mealPrice.toFixed(2)
  );
  const [drinkOnlyPrice, setDrinkOnlyPrice] = useState(
    systemDefaults.drinkOnlyPrice.toFixed(2)
  );

  const handleSave = async () => {
    const updatedDefaults: SystemDefaults = {
      ...systemDefaults,
      orderStartPeriodCount: orderStartTime.count,
      orderStartPeriodType: orderStartTime.period,
      orderStartRelativeTo: orderStartTime.targetDate,
      orderStartTime: orderStartTime.time,
      orderEndPeriodCount: orderEndTime.count,
      orderEndPeriodType: orderEndTime.period,
      orderEndRelativeTo: orderEndTime.targetDate,
      orderEndTime: orderEndTime.time,
      mealPrice: parseFloat(mealPrice),
      drinkOnlyPrice: parseFloat(drinkOnlyPrice),
    };
    await updateSystemDefaults(updatedDefaults);
    setSystemDefaults(updatedDefaults);
  };

  function handleMealPriceChanged(
    event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ): void {
    setMealPrice(event.target.value);
  }

  function handleDrinkPriceChanged(
    event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ): void {
    setDrinkOnlyPrice(event.target.value);
  }

  return (
    <Box sx={{ p: 2, display: "inline-flex", flexDirection: "column", gap: 4 }}>
      <Box>
        <Typography fontWeight="bold">Default Pricing</Typography>
        <Box mt={1} pl={1} pr={1} sx={{display: 'flex', flexDirection: 'row', gap: 2}}>
          <FormControl>
            <InputLabel htmlFor="outlined-adornment-amount">
              Meal Price
            </InputLabel>
            <Input
              id="outlined-adornment-amount"
              startAdornment={
                <InputAdornment position="start">$</InputAdornment>
              }
              value={mealPrice}
              onChange={handleMealPriceChanged}
            />
          </FormControl>
          <FormControl>
            <InputLabel htmlFor="outlined-adornment-amount">
              Drink Only Price
            </InputLabel>
            <Input
              id="outlined-adornment-amount-2"
              startAdornment={
                <InputAdornment position="start">$</InputAdornment>
              }
              value={drinkOnlyPrice}
              onChange={handleDrinkPriceChanged}
            />
          </FormControl>
        </Box>
      </Box>
      <Box>
        <Typography fontWeight="bold">Default Meal Ordering Dates</Typography>
        <Box mt={1} pl={1} pr={1} >
          <Typography variant="caption" fontWeight="bold">
            Start Accepting Orders
          </Typography>
          <SaleDate
            time={orderStartTime}
            onTimeChanged={setOrderStartTime}
          ></SaleDate>
        </Box>
        <Box mt={1} pl={1} pr={1}>
          <Typography variant="caption" fontWeight="bold">
            Stop Accepting Orders
          </Typography>
          <SaleDate
            time={orderEndTime}
            onTimeChanged={setOrderEndTime}
          ></SaleDate>
        </Box>
      </Box>
      <Box textAlign="center">
        <Button variant="contained" onClick={handleSave}>
          Save
        </Button>
      </Box>
    </Box>
  );
};

export default AdminSettingsPage;
