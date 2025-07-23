import React, { useContext, useEffect, useState } from "react";
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
import StudentLunchtimeEditor from "./StudentLunchtimeEditor";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
import { DateTimeUtils } from "../../DateTimeUtils";
import { StudentLunchTime } from "../../models/StudentLunchTime";

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
    setCurrentSchoolYear,
    setSchoolYears,
  } = useContext(AppContext);

  const [studentFirstName, setStudentFirstName] = useState<string>(
    student?.firstName ?? ""
  );
  const [studentLastName, setStudentLastName] = useState<string>(
    student?.lastName ?? ""
  );
  const [studentBirthDate, setStudentBirthDate] = useState<Dayjs | null>(
    student?.birthDate ? dayjs(student.birthDate) : null
  );

  const [studentLunchTimes, setStudentLunchTimes] = useState<StudentLunchTime[]>([])

  useEffect(() => {
    setStudentLunchTimes(currentSchoolYear.studentLunchTimes.filter(slt => slt.studentId === student.id))
  }, [currentSchoolYear, student.id])


  const handleSaveStudent = async () => {
    try {

      const updatedStudent: Student = student
        ? {
            ...student,
            firstName: studentFirstName,
            lastName: studentLastName,
            birthDate: studentBirthDate
              ? DateTimeUtils.toString(studentBirthDate.toDate())
              : "",
          }
        : {
            id: 0,
            name: studentFirstName,
            firstName: studentFirstName,
            lastName: studentLastName,
            studentId: "",
            birthDate: studentBirthDate
              ? DateTimeUtils.toString(studentBirthDate.toDate())
              : "",
            parents: [],
          };
      const studentToSave: StudentWithLunchTimes = {
        ...updatedStudent,
        lunchTimes: currentSchoolYear.id ? studentLunchTimes : undefined,
      };

      const savedStudent = await updateStudent(studentToSave);
      savedStudent.parents = student.parents;
      setStudents(
        students.map((student) =>
          student.id === savedStudent.id ? savedStudent : student
        )
      );

      if (currentSchoolYear.id) {
        const updatedSchoolYear = {
          ...schoolYears.find((sy) => sy.id === currentSchoolYear.id)!,
        };
        updatedSchoolYear.studentLunchTimes =
          currentSchoolYear.studentLunchTimes
            .filter((lt) => lt.studentId !== savedStudent.id)
            .concat(
              studentLunchTimes.map((lt) => ({ ...lt, studentId: savedStudent.id }))
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

  const isSaveDisabled =
    !studentFirstName.length || !studentLastName.length || !studentBirthDate;

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
              student={student}
              onLunchtimesChanged={setStudentLunchTimes}
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
