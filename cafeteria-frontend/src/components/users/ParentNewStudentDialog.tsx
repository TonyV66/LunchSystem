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
  createStudent,
  StudentWithLunchTimes,
} from "../../api/CafeteriaClient";
import Student from "../../models/Student";
import { AxiosError } from "axios";
import { GradeLevel } from "../../models/GradeLevel";
import { DayOfWeek } from "../../models/DayOfWeek";
import User from "../../models/User";
import { Dayjs } from "dayjs";
import { DateTimeUtils } from "../../DateTimeUtils";
import NewStudentPanel from "./NewStudentPanel";

interface DialogProps {
  parent: User;
  onClose: (student?: Student) => void;
}

const ParentNewStudentDialog: React.FC<DialogProps> = ({ parent, onClose }) => {
  const {
    students,
    setStudents,
    setSnackbarErrorMsg,
    schoolYears,
    currentSchoolYear,
    setCurrentSchoolYear,
    setSchoolYears,
  } = useContext(AppContext);

  const [studentFirstName, setStudentFirstName] = useState<string>("");
  const [studentLastName, setStudentLastName] = useState<string>("");
  const [studentBirthDate, setStudentBirthDate] = useState<Dayjs | null>(null);

  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(
    GradeLevel.PRE_K
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

  const handleSaveStudent = async () => {
    try {
      const lunchTimes = [
        {
          grade: selectedGrade,
          dayOfWeek: DayOfWeek.MONDAY,
          studentId: 0,
          teacherId: selectedTeachers[DayOfWeek.MONDAY] || undefined,
        },
        {
          grade: selectedGrade,
          dayOfWeek: DayOfWeek.TUESDAY,
          studentId: 0,
          teacherId: selectedTeachers[DayOfWeek.TUESDAY] || undefined,
        },
        {
          grade: selectedGrade,
          dayOfWeek: DayOfWeek.WEDNESDAY,
          studentId: 0,
          teacherId: selectedTeachers[DayOfWeek.WEDNESDAY] || undefined,
        },
        {
          grade: selectedGrade,
          dayOfWeek: DayOfWeek.THURSDAY,
          studentId: 0,
          teacherId: selectedTeachers[DayOfWeek.THURSDAY] || undefined,
        },
        {
          grade: selectedGrade,
          dayOfWeek: DayOfWeek.FRIDAY,
          studentId: 0,
          teacherId: selectedTeachers[DayOfWeek.FRIDAY] || undefined,
        },
      ];

      const studentToSave: StudentWithLunchTimes = {
        id: 0,
        name: studentFirstName,
        firstName: studentFirstName,
        lastName: studentLastName,
        birthDate: studentBirthDate ? DateTimeUtils.toString(studentBirthDate.toDate()) : "",
        studentId: "",
        parents: [],
        lunchTimes,
      };

      const savedStudent = await createStudent(studentToSave);
      savedStudent.parents = [parent.id];
      setStudents(students.concat(savedStudent));

      if (currentSchoolYear.id) {
        const updatedSchoolYear = {
          ...schoolYears.find((sy) => sy.id === currentSchoolYear.id)!,
        };
        updatedSchoolYear.studentLunchTimes =
          currentSchoolYear.studentLunchTimes
            .filter((lt) => lt.studentId !== savedStudent.id)
            .concat(
              lunchTimes.map((lt) => ({ ...lt, studentId: savedStudent.id }))
            );

        setCurrentSchoolYear(updatedSchoolYear);
        setSchoolYears(
          schoolYears.map((sy) =>
            sy.id !== updatedSchoolYear.id
              ? sy
              : updatedSchoolYear
          )
        );

      }


      onClose(savedStudent);
    } catch (error) {
      const axiosError = error as AxiosError;
      setSnackbarErrorMsg(
        "Error saving student: " +
          (axiosError.response?.data?.toString() ??
            axiosError.response?.statusText ??
            "Unknown server error")
      );
    }
  };

  const isSaveDisabled = !studentFirstName.length || !studentLastName.length || !studentBirthDate;

  return (
    <Dialog
      open={true}
      onClose={() => onClose()}
      fullWidth={true}
      maxWidth="sm"
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle>Add Student</DialogTitle>
      <DialogContent>
        <NewStudentPanel
          studentFirstName={studentFirstName}
          setStudentFirstName={setStudentFirstName}
          studentLastName={studentLastName}
          setStudentLastName={setStudentLastName}
          studentBirthDate={studentBirthDate}
          setStudentBirthDate={setStudentBirthDate}
          selectedGrade={selectedGrade}
          setSelectedGrade={setSelectedGrade}
          selectedTeachers={selectedTeachers}
          setSelectedTeachers={setSelectedTeachers}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={() => onClose()}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSaveStudent}
          disabled={isSaveDisabled}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ParentNewStudentDialog;
