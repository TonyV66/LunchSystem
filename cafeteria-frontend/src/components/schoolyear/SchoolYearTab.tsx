import React from "react";
import { Typography, Box, Stack } from "@mui/material";
import SchoolYear from "../../models/SchoolYear";
import SchoolYearLunchTimesTable from "./SchoolYearLunchTimesTable";
import SchoolYearDescriptionPanel from "./SchoolYearDescriptionPanel";
import GradeLevelConfigPanel from "./GradeLevelConfigPanel";

interface SchoolYearTabProps {
  schoolYear: SchoolYear;
}

const SchoolYearTab: React.FC<SchoolYearTabProps> = ({ schoolYear }) => {
  return (
    <Stack direction="column" gap={2}>
      <Stack direction="row" gap={2}>
        <SchoolYearDescriptionPanel schoolYear={schoolYear} />
        <GradeLevelConfigPanel schoolYear={schoolYear} />
      </Stack>
      <Box>
        <Typography fontWeight="bold" variant="body1">
          All Lunch Times
        </Typography>
        <SchoolYearLunchTimesTable schoolYear={schoolYear} />
      </Box>
    </Stack>
  );
};

export default SchoolYearTab;
