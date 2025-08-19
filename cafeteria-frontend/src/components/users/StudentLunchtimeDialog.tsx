import React, { useContext, useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import {
  updateStudentLunchTimes,
} from "../../api/CafeteriaClient";
import Student from "../../models/Student";
import { AxiosError } from "axios";
import StudentLunchtimeEditor from "./StudentLunchtimeEditor";
import { StudentLunchTime } from "../../models/StudentLunchTime";

interface Props {
  student: Student;
  onClose: (saved: boolean) => void;
}

const StudentLunchtimeDialog: React.FC<Props> = ({
  student,
  onClose,
}) => {
  const { setSnackbarErrorMsg, schoolYears, setSchoolYears, currentSchoolYear, setCurrentSchoolYear } =
    useContext(AppContext);

  const [studentLunchTimes, setStudentLunchTimes] = useState<StudentLunchTime[]>([])

  useEffect(() => {
    setStudentLunchTimes(currentSchoolYear.studentLunchTimes.filter(slt => slt.studentId === student.id))
  }, [currentSchoolYear, student.id])

  const handleSave = async () => {
    try {

      await updateStudentLunchTimes(student.id, studentLunchTimes);

      if (currentSchoolYear.id) {
        const updatedSchoolYear = { ...currentSchoolYear };
        updatedSchoolYear.studentLunchTimes = updatedSchoolYear.studentLunchTimes
          .filter((lt) => lt.studentId !== student.id)
          .concat(studentLunchTimes);
  
        setSchoolYears([
          ...schoolYears.filter((sy) => sy.id !== currentSchoolYear.id),
          updatedSchoolYear,
        ]);
  
        setCurrentSchoolYear(updatedSchoolYear);  
      }


      onClose(true);
    } catch (error) {
      const axiosError = error as AxiosError;
      setSnackbarErrorMsg(
        "Error saving student lunch times: " +
          (axiosError.response?.data?.toString() ??
            axiosError.response?.statusText ??
            "Unknown server error")
      );
    }
  };

  const handleLunchtimesChanged = (lunchTimes: StudentLunchTime[]) => {
    setStudentLunchTimes(lunchTimes);
  };

  return (
    <Dialog
      open={true}
      onClose={() => onClose(false)}
      fullWidth={true}
      maxWidth="xs"
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle>{student.firstName + " " + student.lastName}</DialogTitle>
      <DialogContent>
        <StudentLunchtimeEditor
          student={student}
          onLunchtimesChanged={handleLunchtimesChanged}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={() => onClose(false)}>
          Cancel
        </Button>
        <Button disabled={!studentLunchTimes.length} variant="contained" onClick={handleSave}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudentLunchtimeDialog;
