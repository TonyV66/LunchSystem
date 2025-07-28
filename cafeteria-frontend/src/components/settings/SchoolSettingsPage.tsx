import React, { PropsWithChildren, useContext, useState } from "react";
import { Box, Stack, Typography, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DefaultPricingDialog from "./DefaultPricingDialog";
import OrderingWindowDialog from "./OrderingWindowDialog";
import ReportingScheduleDialog from "./ReportingScheduleDialog";
import RegistrationSettingsDialog from "./RegistrationSettingsDialog";
import SquareSettingsDialog from "./SquareSettingsDialog";

import { AppContext } from "../../AppContextProvider";
import { RelativeDateTarget } from "../../models/SchoolYear";
import SchoolGeneralInfoDialog from "./SchoolGeneralInfoDialog";

const formatRelativeDateTime = (
  time: string,
  count: number,
  target: RelativeDateTarget
): string => {
  return `${time} ${count} day(s) prior to ${
    target === RelativeDateTarget.DAY_MEAL_IS_SERVED ? "day" : "week"
  } of meal`;
};

const StackedCard: React.FC<
  PropsWithChildren<{ title: string; onEdit: () => void }>
> = ({ title, children, onEdit }) => {
  return (
    <Stack direction="column">
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography fontWeight="bold">{title}</Typography>
        <IconButton size="small" color="primary" onClick={onEdit}>
          <EditIcon />
        </IconButton>
      </Stack>

      <Stack
        flexGrow={1}
        gap={2}
        sx={{
          border: "1px solid #e0e0e0",
          p: 2,
          borderRadius: 2,
        }}
      >
        {children}
      </Stack>
    </Stack>
  );
};

const SchoolYearSettingsPage: React.FC = () => {
  const { school } = useContext(AppContext);
  const [defaultPricingDialogOpen, setDefaultPricingDialogOpen] =
    useState(false);
  const [orderingWindowDialogOpen, setOrderingWindowDialogOpen] =
    useState(false);
  const [reportingScheduleDialogOpen, setReportingScheduleDialogOpen] =
    useState(false);
  const [registrationSettingsDialogOpen, setRegistrationSettingsDialogOpen] =
    useState(false);
  const [schoolGeneralDialogOpen, setSchoolGeneralDialogOpen] = useState(false);
  const [squareSettingsDialogOpen, setSquareSettingsDialogOpen] =
    useState(false);

  return (
    <Stack
      direction="column"
      gap={2}
      sx={{
        height: "100%",
      }}
    >
      <Box
        flexGrow={1}
        m={2}
        p={2}
        bgcolor="background.paper"
        sx={{
          display: "grid",
          flexDirection: "column",
          gap: 2,
          borderRadius: 2,
          border: "1px solid #e0e0e0",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "repeat(3, auto)",
        }}
      >
        <StackedCard
          title="School General Settings"
          onEdit={() => setSchoolGeneralDialogOpen(true)}
        >
          <Box>
            <Typography fontWeight="bold">School Name:</Typography>
            <Typography>{school.name}</Typography>
          </Box>
          <Box>
            <Typography fontWeight="bold">Timezone:</Typography>
            <Typography>{school.timezone}</Typography>
          </Box>
        </StackedCard>

        <StackedCard
          title="User Registration"
          onEdit={() => setRegistrationSettingsDialogOpen(true)}
        >
          <Box>
            <Typography fontWeight="bold">Registration Code:</Typography>
            <Typography>{school.registrationCode}</Typography>
          </Box>
          <Box>
            <Typography fontWeight="bold">Open Registration:</Typography>
            <Typography>
              {school.openRegistration ? "Enabled" : "Disabled"}
            </Typography>
          </Box>
        </StackedCard>

        <StackedCard
          title="Square Payment Configuration"
          onEdit={() => setSquareSettingsDialogOpen(true)}
        >
          <Box>
            <Typography fontWeight="bold">Square App ID:</Typography>
            <Typography>
              {school.squareAppId ? school.squareAppId : "Not configured"}
            </Typography>
          </Box>
          <Box>
            <Typography fontWeight="bold">Square Access Token:</Typography>
            <Typography>
              {school.squareAppAccessToken
                ? "••••••••••••••••"
                : "Not configured"}
            </Typography>
          </Box>
          <Box>
            <Typography fontWeight="bold">Square Location ID:</Typography>
            <Typography>
              {school.squareLocationId
                ? school.squareLocationId
                : "Not configured"}
            </Typography>
          </Box>
        </StackedCard>

        <StackedCard
          title="Ordering Window"
          onEdit={() => setOrderingWindowDialogOpen(true)}
        >
          <Box>
            <Typography fontWeight="bold">
              Start Accepting Orders At:
            </Typography>
            <Typography>
              {formatRelativeDateTime(
                school.orderStartTime,
                school.orderStartPeriodCount,
                school.orderStartRelativeTo
              )}
            </Typography>
          </Box>
          <Box>
            <Typography fontWeight="bold">Stop Accepting Orders At:</Typography>
            <Typography>
              {formatRelativeDateTime(
                school.orderEndTime,
                school.orderEndPeriodCount,
                school.orderEndRelativeTo
              )}
            </Typography>
          </Box>
        </StackedCard>

        <StackedCard
          title="Reporting Schedule"
          onEdit={() => setReportingScheduleDialogOpen(true)}
        >
          <Box>
            <Typography fontWeight="bold">Email Classroom Reports:</Typography>
            <Typography>
              {formatRelativeDateTime(
                school.emailReportStartTime,
                school.emailReportStartPeriodCount,
                school.emailReportStartRelativeTo
              )}
            </Typography>
          </Box>
        </StackedCard>

        <StackedCard
          title="Default Pricing"
          onEdit={() => setDefaultPricingDialogOpen(true)}
        >
          <Box>
            <Typography fontWeight="bold">Meal Price:</Typography>
            <Typography>${school.mealPrice.toFixed(2)}</Typography>
          </Box>
          <Box>
            <Typography fontWeight="bold">Drink Only Price:</Typography>
            <Typography>${school.drinkOnlyPrice.toFixed(2)}</Typography>
          </Box>
        </StackedCard>
      </Box>

      <DefaultPricingDialog
        open={defaultPricingDialogOpen}
        onClose={() => setDefaultPricingDialogOpen(false)}
      />

      <OrderingWindowDialog
        open={orderingWindowDialogOpen}
        onClose={() => setOrderingWindowDialogOpen(false)}
      />

      <ReportingScheduleDialog
        open={reportingScheduleDialogOpen}
        onClose={() => setReportingScheduleDialogOpen(false)}
      />

      <RegistrationSettingsDialog
        open={registrationSettingsDialogOpen}
        onClose={() => setRegistrationSettingsDialogOpen(false)}
      />

      <SchoolGeneralInfoDialog
        open={schoolGeneralDialogOpen}
        onClose={() => setSchoolGeneralDialogOpen(false)}
      />

      <SquareSettingsDialog
        open={squareSettingsDialogOpen}
        onClose={() => setSquareSettingsDialogOpen(false)}
      />
    </Stack>
  );
};

export default SchoolYearSettingsPage;
