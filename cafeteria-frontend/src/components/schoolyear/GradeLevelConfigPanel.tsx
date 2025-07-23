import React, { useContext, useState } from "react";
import { Typography, Box, Stack, IconButton } from "@mui/material";
import { Edit } from "@mui/icons-material";
import { green, purple } from "@mui/material/colors";
import SchoolYear from "../../models/SchoolYear";
import GradeLevelConfig from "./GradeLevelConfig";
import GradeLevelConfigDialog from "./GradeLevelConfigDialog";
import { AppContext } from "../../AppContextProvider";

interface GradeLevelConfigPanelProps {
  schoolYear: SchoolYear;
}

const GradeLevelConfigPanel: React.FC<GradeLevelConfigPanelProps> = ({
  schoolYear,
}) => {
  const { schoolYears } = useContext(AppContext);

  const [isGradeLevelConfigOpen, setIsGradeLevelConfigOpen] = useState(false);

  const currentSchoolYear = schoolYears.find((year) => year.isCurrent);

  const isEditable = Boolean(
    !currentSchoolYear ||
      (schoolYear &&
        (schoolYear.isCurrent ||
          schoolYear.startDate > currentSchoolYear.endDate))
  );

  return (
    <>
      <Stack
        className="grade-level-config-container"
        direction="column"
        minWidth={"250px"}
      >
        <Stack
          direction="row"
          justifyContent={"space-between"}
          alignItems={"center"}
        >
          <Stack direction="column">
            <Typography fontWeight="bold" variant="body1">
              How Are Student Lunchtimes Assigned?
            </Typography>

            <Stack direction="row" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: "12px",
                  height: "12px",
                  backgroundColor: green[200],
                  border: "1px solid darkgrey",
                  borderRadius: "50%",
                }}
              ></Box>
              <Typography variant="caption">By Grade Level</Typography>
              <Box
                sx={{
                  width: "12px",
                  height: "12px",
                  backgroundColor: purple[200],
                  border: "1px solid darkgrey",
                  borderRadius: "50%",
                }}
              ></Box>
              <Typography variant="caption">By Teacher Assignment</Typography>
            </Stack>
          </Stack>
          <IconButton
            disabled={!isEditable}
            edge="start"
            color="primary"
            onClick={() => setIsGradeLevelConfigOpen(true)}
          >
            <Edit />
          </IconButton>
        </Stack>
        <Box
          sx={{
            flexGrow: 1,
            border: "1px solid #e0e0e0",
            borderRadius: 2,
            p: 2,
          }}
        >
          <GradeLevelConfig schoolYear={schoolYear} />
        </Box>
      </Stack>
      {isGradeLevelConfigOpen && (
        <GradeLevelConfigDialog
          open={true}
          onClose={() => setIsGradeLevelConfigOpen(false)}
          schoolYear={schoolYear}
        />
      )}
    </>
  );
};

export default GradeLevelConfigPanel;
