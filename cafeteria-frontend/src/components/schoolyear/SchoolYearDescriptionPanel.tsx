import React, { useState } from "react";
import { Typography, Stack, IconButton, Button } from "@mui/material";
import { Edit } from "@mui/icons-material";
import SchoolYear, { NO_SCHOOL_YEAR } from "../../models/SchoolYear";
import SchoolYearDialog from "./SchoolYearDialog";
import ConfirmDialog from "../ConfirmDialog";
import { AppContext } from "../../AppContextProvider";
import { toggleSchoolYearCurrent } from "../../api/CafeteriaClient";
import { AxiosError } from "axios";

interface SchoolYearDescriptionPanelProps {
  schoolYear: SchoolYear;
}

const SchoolYearDescriptionPanel: React.FC<SchoolYearDescriptionPanelProps> = ({
  schoolYear,
}) => {
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
  } = React.useContext(AppContext);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const currentSchoolYear = schoolYears.find((year) => year.isCurrent);

  const isEditable = Boolean(
    !currentSchoolYear ||
      (schoolYear &&
        (schoolYear.isCurrent ||
          schoolYear.startDate > currentSchoolYear.endDate))
  );

  const handleSchoolYearChanged = () => {
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
      setCurrentSchoolYear(
        updatedSessionInfo.schoolYears.find((sy) => sy.isCurrent) ??
          NO_SCHOOL_YEAR
      );

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
    <>
      <Stack direction="column" minWidth={"250px"}>
        <Stack
          sx={{ height: "45px" }}
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
          gap={2}
          sx={{
            border: "1px solid #e0e0e0",
            p: 2,
            borderRadius: 2,
          }}
        >
          <Stack>
            <Typography fontWeight="bold">Name</Typography>
            <Typography>{schoolYear.name}</Typography>
          </Stack>
          <Stack direction="row" gap={2}>
            <Stack>
              <Typography fontWeight="bold">Start Date</Typography>
              <Typography>
                {new Date(schoolYear.startDate + "T00:00:00").toLocaleDateString()}
              </Typography>
            </Stack>
            <Stack>
              <Typography fontWeight="bold">End Date</Typography>
              <Typography>
                {new Date(schoolYear.endDate + "T00:00:00").toLocaleDateString()}
              </Typography>
            </Stack>
          </Stack>
          <Stack direction="row" gap={1} alignItems="center">
            <Typography fontWeight="bold">Hide Meal Schedule:</Typography>
            <Typography>{schoolYear.hideSchedule ? "Yes" : "No"}</Typography>
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
      </Stack>
      {isEditDialogOpen && (
        <SchoolYearDialog
          onClose={handleSchoolYearChanged}
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
    </>
  );
};

export default SchoolYearDescriptionPanel;
