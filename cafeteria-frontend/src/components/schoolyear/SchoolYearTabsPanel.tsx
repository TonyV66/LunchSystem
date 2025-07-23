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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`school-year-tabpanel-${index}`}
      aria-labelledby={`school-year-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const SchoolYearTabsPanel: React.FC = () => {
  const { yearId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { schoolYears } = useContext(AppContext);

  const schoolYear = schoolYears.find(
    (year) => year.id === parseInt(yearId ?? "0")
  );

  // Determine selected tab based on URL path
  const getSelectedTab = () => {
    if (matchRoutes([{ path: "/year/:yearId/grades" }], location.pathname))
      return 1;
    if (matchRoutes([{ path: "/year/:yearId/teachers" }], location.pathname))
      return 2;
    return 0; // Default to general tab
  };

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
        <Tabs value={getSelectedTab()} onChange={handleTabChange}>
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
      <Paper sx={{ mb: 2, flex: 1, display: "flex", flexDirection: "column" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}></Box>
        <TabPanel value={getSelectedTab()} index={0}>
          <SchoolYearTab schoolYear={schoolYear} />
        </TabPanel>
        <TabPanel value={getSelectedTab()} index={1}>
          <GradeLevelLunchTimesTable schoolYear={schoolYear} />
        </TabPanel>
        <TabPanel value={getSelectedTab()} index={2}>
          <TeacherLunchTimesTable schoolYear={schoolYear} />
        </TabPanel>
      </Paper>
    </Stack>
  );
};

export default SchoolYearTabsPanel;
