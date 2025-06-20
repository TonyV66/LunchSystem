import React, { useContext, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Stack,
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
import { Role } from "../../models/User";
import StudentLunchtimeEditor from "./StudentLunchtimeEditor";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
import { DateTimeUtils } from "../../DateTimeUtils";

interface DialogProps {
  student: Student;
  onClose: (student?: Student) => void;
}

const EditStudentDialog: React.FC<DialogProps> = ({ onClose, student }) => {
  const {
    students,
    setStudents,
    setSnackbarErrorMsg,
    schoolYears,
    currentSchoolYear,
    setSchoolYears,
    users,
  } = useContext(AppContext);

  const [studentFirstName, setStudentFirstName] = useState<string>(student?.firstName ?? "");
  const [studentLastName, setStudentLastName] = useState<string>(student?.lastName ?? "");
  const [studentBirthDate, setStudentBirthDate] = useState<Dayjs | null>(
    student?.birthDate ? dayjs(student.birthDate) : null
  );

  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(
    currentSchoolYear.studentLunchTimes.find(
      (lt) => lt.studentId === student.id
    )?.grade ?? GradeLevel.PRE_K
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
    if (student) {
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
    }
  }, [student, currentSchoolYear]);

  const teachers = users
    .filter((user) => user.role === Role.TEACHER)
    .sort((t1, t2) =>
      t1.name.toLowerCase().localeCompare(t2.name.toLowerCase())
    );

  const handleGradeSelected = (grade: GradeLevel) => {
    setSelectedGrade(grade);
  };

  const handleTeacherChange = (day: DayOfWeek, teacherId: number) => {
    setSelectedTeachers((prev) => ({
      ...prev,
      [day]: teacherId,
    }));
  };

  const handleSaveStudent = async () => {
    try {
      const lunchTimes = !currentSchoolYear.id
        ? []
        : [
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

      const updatedStudent: Student = student
        ? { 
            ...student, 
            firstName: studentFirstName, 
            lastName: studentLastName,
            birthDate: studentBirthDate ? DateTimeUtils.toString(studentBirthDate.toDate()) : "",
          }
        : {
            id: 0,
            name: studentFirstName,
            firstName: studentFirstName,
            lastName: studentLastName,
            studentId: "",
            birthDate: studentBirthDate ? DateTimeUtils.toString(studentBirthDate.toDate()) : "",
            parents: [],
          };
      const studentToSave: StudentWithLunchTimes = {
        ...updatedStudent,
        lunchTimes: currentSchoolYear.id ? lunchTimes : undefined,
      };

      const savedStudent = await updateStudent(studentToSave);
      savedStudent.parents = student.parents;
      setStudents(
        students.map((student) =>
          student.id === savedStudent.id
            ? savedStudent
            : { ...student, name: studentFirstName }
        )
      );

      if (currentSchoolYear.id) {
        setSchoolYears(
          schoolYears.map((sy) =>
            sy.id !== currentSchoolYear.id
              ? sy
              : {
                  ...sy,
                  studentLunchTimes: sy.studentLunchTimes
                    .filter((lt) => lt.studentId !== savedStudent.id)
                    .concat(
                      lunchTimes.map((lt) => ({
                        ...lt,
                        studentId: savedStudent.id,
                      }))
                    ),
                }
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
      <DialogTitle>Edit Student</DialogTitle>
      <DialogContent>
        <Stack gap={2} direction="column">
          <TextField
            required
            label="First Name"
            variant="standard"
            value={studentFirstName}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setStudentFirstName(event.target.value)
            }
          />
          <TextField
            required
            label="Last Name"
            variant="standard"
            value={studentLastName}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setStudentLastName(event.target.value)
            }
          />
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Birth Date"
              value={studentBirthDate}
              onChange={(newValue) => setStudentBirthDate(newValue)}
              slotProps={{
                textField: {
                  variant: "standard",
                  fullWidth: true,
                  required: true,
                },
              }}
            />
          </LocalizationProvider>
          {currentSchoolYear.id ? (
            <StudentLunchtimeEditor
              schoolYear={currentSchoolYear}
              selectedGrade={selectedGrade}
              selectedTeachers={selectedTeachers}
              teachers={teachers}
              onGradeSelected={handleGradeSelected}
              onTeacherChange={handleTeacherChange}
            />
          ) : (
            <></>
          )}
        </Stack>
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

export default EditStudentDialog;
