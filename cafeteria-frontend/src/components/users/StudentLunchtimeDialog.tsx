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
  onClose: () => void;
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


      onClose();
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

  return (
    <Dialog
      open={true}
      onClose={() => onClose()}
      fullWidth={true}
      maxWidth="sm"
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle>{student.firstName + " " + student.lastName}</DialogTitle>
      <DialogContent>
        <StudentLunchtimeEditor
          student={student}
          onLunchtimesChanged={setStudentLunchTimes}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={() => onClose()}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudentLunchtimeDialog;
