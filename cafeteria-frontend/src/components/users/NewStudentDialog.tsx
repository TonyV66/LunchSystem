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
  createStudent,
  StudentWithLunchTimes,
} from "../../api/CafeteriaClient";
import Student from "../../models/Student";
import { AxiosError } from "axios";
import { GradeLevel } from "../../models/GradeLevel";
import { DayOfWeek } from "../../models/DayOfWeek";
import User, { Role } from "../../models/User";
import StudentLunchtimeEditor from "./StudentLunchtimeEditor";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { Dayjs } from "dayjs";
import { DateTimeUtils } from "../../DateTimeUtils";

interface DialogProps {
  parent: User;
  onClose: (student?: Student) => void;
}

const NewStudentDialog: React.FC<DialogProps> = ({ parent, onClose }) => {
  const {
    students,
    setStudents,
    setSnackbarErrorMsg,
    schoolYears,
    currentSchoolYear,
    setSchoolYears,
    users,
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
                },
              }}
            />
          </LocalizationProvider>

          <StudentLunchtimeEditor
            schoolYear={currentSchoolYear}
            selectedGrade={selectedGrade}
            selectedTeachers={selectedTeachers}
            teachers={teachers}
            onGradeSelected={handleGradeSelected}
            onTeacherChange={handleTeacherChange}
          />
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

export default NewStudentDialog;
