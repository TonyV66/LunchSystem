import React from "react";
import { Box } from "@mui/material";
import GradeLevelLunchTimesTable from "./GradeLevelLunchTimesTable";
import SchoolYear from "../../models/SchoolYear";

interface GradeLevelLunchTimesTabProps {
  schoolYear: SchoolYear;
}

const GradeLevelLunchTimesTab: React.FC<GradeLevelLunchTimesTabProps> = ({ schoolYear }) => {

  return (
    <Box>
      <GradeLevelLunchTimesTable schoolYear={schoolYear} />
    </Box>
  );
};

export default GradeLevelLunchTimesTab; 