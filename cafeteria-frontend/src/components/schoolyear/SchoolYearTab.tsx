import React, { useContext, useState } from "react";
import { Typography, Box, Stack, IconButton, Button } from "@mui/material";
import { Edit } from "@mui/icons-material";
import { green, purple } from "@mui/material/colors";
import SchoolYear, { NO_SCHOOL_YEAR } from "../../models/SchoolYear";
import GradeLevelConfig from "./GradeLevelConfig";
import SchoolYearLunchTimesTable from "./SchoolYearLunchTimesTable";
import SchoolYearDialog from "./SchoolYearDialog";
import GradeLevelConfigDialog from "./GradeLevelConfigDialog";
import ConfirmDialog from "../ConfirmDialog";
import { AppContext } from "../../AppContextProvider";
import { toggleSchoolYearCurrent } from "../../api/CafeteriaClient";
import { AxiosError } from "axios";

interface SchoolYearTabProps {
  schoolYear: SchoolYear;
}

const SchoolYearTab: React.FC<SchoolYearTabProps> = ({ schoolYear }) => {
  const {
    schoolYears,
    setSchoolYears,
    setSnackbarErrorMsg,
    setShowGlassPane,
    setSnackbarMsg,
    setCurrentSchoolYear,
    setUsers,
    setScheduledMenus,
    setOrders,
    setStudents,
    setUser,
    setMenus,
    setNotifications,
    setPantryItems,
    setSchool,
  } = useContext(AppContext);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isGradeLevelConfigOpen, setIsGradeLevelConfigOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const currentSchoolYear = schoolYears.find((year) => year.isCurrent);

  const isEditable = Boolean(
    !currentSchoolYear ||
      (schoolYear &&
        (schoolYear.isCurrent ||
          new Date(schoolYear.startDate) > new Date(currentSchoolYear.endDate)))
  );

  const handleSchoolYearChanged = (updatedSchoolYear?: SchoolYear) => {
    if (updatedSchoolYear) {
      setSchoolYears(
        schoolYears.map((year) =>
          year.id === updatedSchoolYear.id ? updatedSchoolYear : year
        )
      );
    }
    setIsEditDialogOpen(false);
  };


  const handleToggleCurrent = async () => {
    if (schoolYear.isCurrent) {
      setIsConfirmDialogOpen(true);
      return;
    }

    if (!schoolYear.isCurrent && currentSchoolYear) {
      setIsConfirmDialogOpen(true);
      return;
    }

    await performToggleCurrent();
  };

  const performToggleCurrent = async () => {
    try {
      setShowGlassPane(true);
      const updatedSessionInfo = await toggleSchoolYearCurrent(schoolYear.id);
      
      setUser(updatedSessionInfo.user);
      setUsers(updatedSessionInfo.users);
      setStudents(updatedSessionInfo.students);
      setOrders(updatedSessionInfo.orders);
      setMenus(updatedSessionInfo.menus);
      setScheduledMenus(updatedSessionInfo.scheduledMenus);
      setNotifications(updatedSessionInfo.notifications);
      setPantryItems(updatedSessionInfo.pantryItems);
      setSchool(updatedSessionInfo.school);
      setSchoolYears(updatedSessionInfo.schoolYears);
      setCurrentSchoolYear(updatedSessionInfo.schoolYears.find((sy) => sy.isCurrent) ?? NO_SCHOOL_YEAR);
 
      setSnackbarMsg("School year updated");
    } catch (error) {
      setShowGlassPane(false);
      if (error instanceof AxiosError) {
        setSnackbarErrorMsg(error.response?.data ?? error.message);
      } else {
        setSnackbarErrorMsg("An unknown error occurred");
      }
    }
  };

  return (
    <Stack direction="column" gap={2}>
      <Stack direction="row" gap={2}>
        <Stack
          minWidth={"250px"}
          direction="row"
          justifyContent={"space-between"}
          alignItems={"flex-end"}
        >
          <Typography fontWeight="bold" variant="body1">
            Description
          </Typography>
          <IconButton
            edge="start"
            disabled={!isEditable}
            color="primary"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Edit />
          </IconButton>
        </Stack>
        <Stack
          flexGrow={1}
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
              <Typography variant="caption">By Classroom Assignment</Typography>
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
      </Stack>
      <Stack direction="row" gap={2}>
        <Box minWidth={"250px"}>
          <Stack
            gap={2}
            sx={{
              border: "1px solid #e0e0e0",
              p: 2,
              borderRadius: 2,
            }}
          >
            <Stack gap={1}>
              <Typography fontWeight="bold">Name</Typography>
              <Typography>{schoolYear.name}</Typography>
            </Stack>
            <Stack direction="row" gap={2}>
              <Stack gap={1}>
                <Typography fontWeight="bold">Start Date</Typography>
                <Typography>
                  {new Date(schoolYear.startDate).toLocaleDateString()}
                </Typography>
              </Stack>
              <Stack gap={1}>
                <Typography fontWeight="bold">End Date</Typography>
                <Typography>
                  {new Date(schoolYear.endDate).toLocaleDateString()}
                </Typography>
              </Stack>
            </Stack>
            <Button
              variant="contained"
              size="small"
              color={schoolYear.isCurrent ? "error" : "primary"}
              onClick={handleToggleCurrent}
            >
              {schoolYear.isCurrent ? "Deactivate Year" : "Activate Year"}
            </Button>
          </Stack>
        </Box>
        <Box
          sx={{
            flexGrow: 1,
            border: "1px solid #e0e0e0",
            borderRadius: 2,
          }}
        >
          <Box p={2}>
            <GradeLevelConfig schoolYear={schoolYear} />
          </Box>
        </Box>
      </Stack>
      <Box>
        <Typography fontWeight="bold" variant="body1" mb={2}>
          All Lunch Times
        </Typography>
        <SchoolYearLunchTimesTable schoolYear={schoolYear} />
      </Box>
      {isEditDialogOpen && (
        <SchoolYearDialog
          onClose={handleSchoolYearChanged}
          schoolYear={schoolYear}
        />
      )}
      {isGradeLevelConfigOpen && (
        <GradeLevelConfigDialog
          open={true}
          onClose={() => setIsGradeLevelConfigOpen(false)}
          schoolYear={schoolYear}
        />
      )}
      <ConfirmDialog
        open={isConfirmDialogOpen}
        title={
          schoolYear.isCurrent
            ? "Deactivate School Year"
            : "Activate School Year"
        }
        onOk={() => {
          setIsConfirmDialogOpen(false);
          performToggleCurrent();
        }}
        onCancel={() => setIsConfirmDialogOpen(false)}
      >
        {schoolYear.isCurrent
          ? `Orders will no longer be accepted for students enrolled for "${schoolYear.name}". Do you want to continue?`
          : `Orders will only be accepted for students enrolled for "${schoolYear.name}". Do you want to continue?`}
      </ConfirmDialog>
    </Stack>
  );
};

export default SchoolYearTab;
