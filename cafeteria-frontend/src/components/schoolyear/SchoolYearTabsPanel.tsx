import React, { useContext } from "react";
import { Typography, Box, Paper, Tabs, Tab, Stack } from "@mui/material";
import {
  useParams,
  useNavigate,
  useLocation,
  matchRoutes,
} from "react-router-dom";
import { AppContext } from "../../AppContextProvider";
import SchoolYearTab from "./SchoolYearTab";
import GradeLevelLunchTimesTable from "./GradeLevelLunchTimesTable";
import TeacherLunchTimesTable from "./TeacherLunchTimesTable";

enum TABS {
  GENERAL = 0,
  GRADE_LEVEL_LUNCHTIMES = 1,
  TEACHER_LUNCHTIMES = 2,
}

const SchoolYearTabsPanel: React.FC = () => {
  const { yearId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { schoolYears } = useContext(AppContext);

  const schoolYear = schoolYears.find(
    (year) => year.id === parseInt(yearId ?? "0")
  );

  const selectedTab = matchRoutes(
    [{ path: "/year/:yearId/grades" }],
    location.pathname
  )
    ? TABS.GRADE_LEVEL_LUNCHTIMES
    : matchRoutes([{ path: "/year/:yearId/teachers" }], location.pathname)
    ? TABS.TEACHER_LUNCHTIMES
    : TABS.GENERAL;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    const baseUrl = `/year/${yearId}`;
    switch (newValue) {
      case 1:
        navigate(`${baseUrl}/grades`);
        break;
      case 2:
        navigate(`${baseUrl}/teachers`);
        break;
      default:
        navigate(baseUrl);
    }
  };

  if (!schoolYear?.id) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h4">School Year {yearId} not found</Typography>
      </Box>
    );
  }

  return (
    <Stack
      pl={2}
      pr={2}
      direction="column"
      gap={1}
      sx={{
        height: "100%",
      }}
    >
      <Stack
        direction="row"
        spacing={2}
        justifyContent="space-between"
        alignItems="flex-end"
      >
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab label="General" />
          <Tab label="Grade Level Lunchtimes" />
          <Tab label="Teacher Lunchtimes" />
        </Tabs>
        <Stack direction="column">
          <Typography variant="body2" fontWeight="bold">
            School Year:
          </Typography>
          <Typography variant="body2">{schoolYear.name}</Typography>
        </Stack>
      </Stack>
      <Paper
        sx={{
          mb: 2,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
        }}
      >
        {selectedTab === TABS.GENERAL && (
          <Box m={2}>
            <SchoolYearTab schoolYear={schoolYear} />
          </Box>
        )}
        {selectedTab === TABS.GRADE_LEVEL_LUNCHTIMES && (
          <Box m={2}>
            <GradeLevelLunchTimesTable schoolYear={schoolYear} />
          </Box>
        )}
        {selectedTab === TABS.TEACHER_LUNCHTIMES && (
          <Box m={2}>
            <TeacherLunchTimesTable schoolYear={schoolYear} />
          </Box>
        )}
      </Paper>
    </Stack>
  );
};

export default SchoolYearTabsPanel;
