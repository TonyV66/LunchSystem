import React, { useContext, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import SchoolYear from "../../models/SchoolYear";
import { createSchoolYear, updateSchoolYear } from "../../api/CafeteriaClient";
import { AxiosError } from "axios";
import { DateTimeUtils } from "../../DateTimeUtils";
import BasicSchoolYearPanel from "./BasicSchoolYearPanel";
import { useNavigate } from "react-router-dom";
import { SCHOOL_YEAR_URL } from "../../MainAppPanel";

interface DialogProps {
  onClose: (schoolYear?: SchoolYear) => void;
  schoolYear?: SchoolYear;
}

const getDefaultSchoolYear = (): SchoolYear => {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setFullYear(startDate.getFullYear() + 1);
  
  return {
    id: 0,
    name: `${startDate.getFullYear()} - ${endDate.getFullYear()}`,
    startDate: DateTimeUtils.toString(startDate),
    endDate: DateTimeUtils.toString(endDate),
    hideSchedule: true,
    studentLunchTimes: [],
    gradeLunchTimes: [],
    teacherLunchTimes: [],
    lunchTimes: [],
    isCurrent: false,
    oneTeacherPerStudent: true,
    gradesAssignedByClass: [],
  };
};

const SchoolYearDialog: React.FC<DialogProps> = ({ onClose, schoolYear }) => {
  const { schoolYears, setSchoolYears, setSnackbarErrorMsg, currentSchoolYear, setCurrentSchoolYear } = useContext(AppContext);
  const [updatedSchoolYear, setUpdatedSchoolYear] = useState<SchoolYear>(
    schoolYear ?? getDefaultSchoolYear()
  );

  const navigate = useNavigate();

  const handleSchoolYearChanged = (changedSchoolYear: SchoolYear) => {
    setUpdatedSchoolYear(changedSchoolYear);
  };

  const handleSave = async () => {
    try {
      const savedSchoolYear = updatedSchoolYear.id
        ? await updateSchoolYear(updatedSchoolYear)
        : await createSchoolYear(updatedSchoolYear);

      if (updatedSchoolYear.id) {
        setSchoolYears(
          schoolYears.map((year) =>
            year.id === savedSchoolYear.id ? savedSchoolYear : year
          )
        );
        if (currentSchoolYear.id === savedSchoolYear.id) {
          setCurrentSchoolYear(savedSchoolYear);
        }
      } else {
        setSchoolYears([...schoolYears, savedSchoolYear]);
        navigate(SCHOOL_YEAR_URL + '/' + savedSchoolYear.id)
      }
      onClose(savedSchoolYear);
    } catch (error) {
      if (error instanceof AxiosError) {
        setSnackbarErrorMsg(error.response?.data ?? error.message);
      } else {
        setSnackbarErrorMsg("An unknown error occurred");
      }
    }
  };

  return (
    <Dialog
      open={true}
      maxWidth="sm"
      onClose={() => {return;}}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle>
        {schoolYear ? "Edit School Year" : "New School Year"}
      </DialogTitle>
      <DialogContent
        sx={{
          overflow: "hidden",
          pt: 2,
        }}
      >
        <BasicSchoolYearPanel
          schoolYear={updatedSchoolYear}
          onSchoolYearChanged={handleSchoolYearChanged}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={updatedSchoolYear.hideSchedule}
              onChange={(event) =>
                setUpdatedSchoolYear({ ...updatedSchoolYear, hideSchedule: event.target.checked })
              }
              disabled={!updatedSchoolYear.isCurrent}
            />
          }
          label="Hide Meal Schedule"
        />
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={() => onClose()}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!updatedSchoolYear.name.trim().length}
          onClick={handleSave}
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SchoolYearDialog;
