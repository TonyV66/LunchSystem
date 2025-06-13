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
  updateStudent,
  StudentWithLunchTimes,
} from "../../api/CafeteriaClient";
import Student from "../../models/Student";
import { AxiosError } from "axios";
import { GradeLevel } from "../../models/GradeLevel";
import { DayOfWeek } from "../../models/DayOfWeek";
import SchoolYear from "../../models/SchoolYear";
import StudentLunchtimeEditor from "./StudentLunchtimeEditor";
import { Role } from "../../models/User";

interface Props {
  schoolYear: SchoolYear;
  student: Student;
  onClose: (student?: Student) => void;
}

const StudentLunchtimeDialog: React.FC<Props> = ({
  schoolYear,
  student,
  onClose,
}) => {
  const { setSnackbarErrorMsg, schoolYears, setSchoolYears, users } =
    useContext(AppContext);

  const teachers = users
    .filter((user) => user.role === Role.TEACHER)
    .sort((t1, t2) =>
      t1.name.toLowerCase().localeCompare(t2.name.toLowerCase())
    );

  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(
    schoolYear.studentLunchTimes.find((lt) => lt.studentId === student.id)
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

    schoolYear.studentLunchTimes
      .filter((lt) => lt.studentId === student.id)
      .forEach((lt) => {
        if (lt.teacherId) {
          initialTeachers[lt.dayOfWeek as DayOfWeek] = lt.teacherId;
        }
      });

    setSelectedTeachers(initialTeachers);
  }, [student, schoolYear]);

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

      const studentToSave: StudentWithLunchTimes = {
        ...student,
        lunchTimes,
      };

      const savedStudent = await updateStudent(studentToSave);

      setSchoolYears(
        schoolYears.map((sy) =>
          sy.id !== schoolYear.id
            ? sy
            : {
                ...sy,
                studentLunchTimes: sy.studentLunchTimes
                  .filter((lt) => lt.studentId !== student.id)
                  .concat(lunchTimes),
              }
        )
      );

      onClose(savedStudent);
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
      <DialogTitle>{student.name}</DialogTitle>
      <DialogContent>
        <StudentLunchtimeEditor
          schoolYear={schoolYear}
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
