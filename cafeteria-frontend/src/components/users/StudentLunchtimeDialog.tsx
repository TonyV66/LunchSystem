import React, { useContext, useState } from "react";
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
import { GradeLevel } from "../../models/GradeLevel";
import { DayOfWeek } from "../../models/DayOfWeek";
import StudentLunchtimeEditor from "./StudentLunchtimeEditor";
import { Role } from "../../models/User";

interface Props {
  student: Student;
  onClose: () => void;
}

const StudentLunchtimeDialog: React.FC<Props> = ({
  student,
  onClose,
}) => {
  const { setSnackbarErrorMsg, schoolYears, setSchoolYears, users, currentSchoolYear, setCurrentSchoolYear } =
    useContext(AppContext);

  const teachers = users
    .filter((user) => user.role === Role.TEACHER)
    .sort((t1, t2) =>
      t1.name.toLowerCase().localeCompare(t2.name.toLowerCase())
    );

  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(
    currentSchoolYear.studentLunchTimes.find((lt) => lt.studentId === student.id)
      ?.grade ?? GradeLevel.PRE_K
  );

  const [selectedTeachers, setSelectedTeachers] = useState<
    Record<DayOfWeek, number | null>
  >({
    [DayOfWeek.SUNDAY]: null,
    [DayOfWeek.MONDAY]: null,
    [DayOfWeek.TUESDAY]: null,
    [DayOfWeek.WEDNESDAY]: null,
    [DayOfWeek.THURSDAY]: null,
    [DayOfWeek.FRIDAY]: null,
    [DayOfWeek.SATURDAY]: null,
  });

  // Initialize selected teachers from existing student lunch times
  React.useEffect(() => {
    const initialTeachers: Record<DayOfWeek, number | null> = {
      [DayOfWeek.SUNDAY]: null,
      [DayOfWeek.MONDAY]: null,
      [DayOfWeek.TUESDAY]: null,
      [DayOfWeek.WEDNESDAY]: null,
      [DayOfWeek.THURSDAY]: null,
      [DayOfWeek.FRIDAY]: null,
      [DayOfWeek.SATURDAY]: null,
    };

    currentSchoolYear.studentLunchTimes
      .filter((lt) => lt.studentId === student.id)
      .forEach((lt) => {
        if (lt.teacherId) {
          initialTeachers[lt.dayOfWeek as DayOfWeek] = lt.teacherId;
        }
      });

    setSelectedTeachers(initialTeachers);
  }, [student, currentSchoolYear]);

  const handleGradeSelected = (grade: GradeLevel) => {
    setSelectedGrade(grade);
  };

  const handleTeacherChange = (day: DayOfWeek, teacherId: number) => {
    setSelectedTeachers((prev) => ({
      ...prev,
      [day]: teacherId,
    }));
  };

  const handleSave = async () => {
    try {
      const lunchTimes = [
        {
          grade: selectedGrade,
          dayOfWeek: DayOfWeek.MONDAY,
          studentId: student.id,
          teacherId: selectedTeachers[DayOfWeek.MONDAY] || undefined,
        },
        {
          grade: selectedGrade,
          dayOfWeek: DayOfWeek.TUESDAY,
          studentId: student.id,
          teacherId: selectedTeachers[DayOfWeek.TUESDAY] || undefined,
        },
        {
          grade: selectedGrade,
          dayOfWeek: DayOfWeek.WEDNESDAY,
          studentId: student.id,
          teacherId: selectedTeachers[DayOfWeek.WEDNESDAY] || undefined,
        },
        {
          grade: selectedGrade,
          dayOfWeek: DayOfWeek.THURSDAY,
          studentId: student.id,
          teacherId: selectedTeachers[DayOfWeek.THURSDAY] || undefined,
        },
        {
          grade: selectedGrade,
          dayOfWeek: DayOfWeek.FRIDAY,
          studentId: student.id,
          teacherId: selectedTeachers[DayOfWeek.FRIDAY] || undefined,
        },
      ];

      await updateStudentLunchTimes(student.id, lunchTimes);

      if (currentSchoolYear.id) {
        const updatedSchoolYear = { ...currentSchoolYear };
        updatedSchoolYear.studentLunchTimes = updatedSchoolYear.studentLunchTimes
          .filter((lt) => lt.studentId !== student.id)
          .concat(lunchTimes);
  
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
          schoolYear={currentSchoolYear}
          selectedGrade={selectedGrade}
          selectedTeachers={selectedTeachers}
          teachers={teachers}
          onGradeSelected={handleGradeSelected}
          onTeacherChange={handleTeacherChange}
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
