import React from "react";
import { Box, Typography } from "@mui/material";
import { getGradeName, GradeLevel } from "../../models/GradeLevel";
import SchoolYear from "../../models/SchoolYear";
import { green, purple } from "@mui/material/colors";

interface Props {
  schoolYear: SchoolYear;
}

const GradeLevelConfig: React.FC<Props> = ({ schoolYear }) => {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
      {Object.values(GradeLevel)
        .filter((grade) => grade !== GradeLevel.UNKNOWN)
        .map((gradeLevel) => (
          <Box key={gradeLevel} sx={{ display: "flex", width: "125px" }}>
            <Box
              sx={{
                width: "12px",
                height: "12px",
                backgroundColor: schoolYear.gradesAssignedByClass.includes(gradeLevel)
                  ? purple[200]
                  : green[200],
                border: "1px solid darkgrey",
                borderRadius: "50%",
              }}
            ></Box>

            <Typography variant="body2" sx={{ ml: 1 }}>
              {getGradeName(gradeLevel)}
            </Typography>
          </Box>
        ))}
    </Box>
  );
};

export default GradeLevelConfig;
