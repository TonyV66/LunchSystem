import React, { useContext, useState } from "react";
import { Box, Paper, Stack, Typography, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DefaultPricingDialog from "./DefaultPricingDialog";
import OrderingWindowDialog from "./OrderingWindowDialog";
import { AppContext } from "../../AppContextProvider";

export enum RelativeDateCountType {
  DAYS = 0,
  WEEKS = 1,
}

export enum RelativeDateTarget {
  DAY_MEAL_IS_SERVED = 0,
  WEEK_MEAL_IS_SERVED = 1,
}

const formatRelativeDateTime = (
  time: string,
  count: number,
  period: RelativeDateCountType,
  target: RelativeDateTarget
): string => {
  return `${time} ${count} ${
    period === RelativeDateCountType.DAYS ? "day(s)" : "week(s)"
  } prior to ${
    target === RelativeDateTarget.DAY_MEAL_IS_SERVED ? "day" : "week"
  } of meal`;
};

const SchoolSettingsPanel: React.FC = () => {
  const { school } = useContext(AppContext);
  const [defaultPricingDialogOpen, setDefaultPricingDialogOpen] =
    useState(false);
  const [orderingWindowDialogOpen, setOrderingWindowDialogOpen] =
    useState(false);

  return (
    <Stack direction="row" gap={2} alignItems='stretch'>
      <Stack direction="column">
        <Stack direction="row" justifyContent="space-between" alignItems='center'>
          <Typography fontWeight='bold' variant="body2">Default Pricing</Typography>
          <IconButton size="small" color='primary' onClick={() => setDefaultPricingDialogOpen(true)}>
            <EditIcon />
          </IconButton>
        </Stack>

        <Paper sx={{ p: 2, flexGrow: 1}}>
          <Stack direction="row" gap={2}>
            <Box>
              <Typography variant="caption" fontWeight="bold">
                Meal Price:
              </Typography>
              <Typography>${school.mealPrice.toFixed(2)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" fontWeight="bold">
                Drink Only Price:
              </Typography>
              <Typography>${school.drinkOnlyPrice.toFixed(2)}</Typography>
            </Box>
          </Stack>
        </Paper>
      </Stack>

      <Stack direction="column">
        <Stack direction="row" justifyContent="space-between" alignItems='center'>
          <Typography fontWeight='bold' variant="body2">Ordering Window</Typography>
          <IconButton size="small" color='primary' onClick={() => setOrderingWindowDialogOpen(true)}>
            <EditIcon />
          </IconButton>
        </Stack>
        <Paper sx={{ p: 2 }}>
          <Stack direction="column" gap={2}>
            <Box>
              <Typography variant="caption" fontWeight="bold">
                Start Accepting Orders At:
              </Typography>
              <Typography>
                {formatRelativeDateTime(
                  school.orderStartTime,
                  school.orderStartPeriodCount,
                  school.orderStartPeriodType,
                  school.orderStartRelativeTo
                )}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" fontWeight="bold">
                Stop Accepting Orders At:
              </Typography>
              <Typography>
                {formatRelativeDateTime(
                  school.orderEndTime,
                  school.orderEndPeriodCount,
                  school.orderEndPeriodType,
                  school.orderEndRelativeTo
                )}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Stack>

      <DefaultPricingDialog
        open={defaultPricingDialogOpen}
        onClose={() => setDefaultPricingDialogOpen(false)}
      />

      <OrderingWindowDialog
        open={orderingWindowDialogOpen}
        onClose={() => setOrderingWindowDialogOpen(false)}
      />
    </Stack>
  );
};

export default SchoolSettingsPanel;
