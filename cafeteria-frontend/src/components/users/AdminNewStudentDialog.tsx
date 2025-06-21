import React, { useContext, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Typography,
  Stack,
  Alert,
} from "@mui/material";
import Student from "../../models/Student";
import User from "../../models/User";
import StudentAutoCompleteSelector from "./StudentAutoCompleteSelector";
import { Dayjs } from "dayjs";
import { DayOfWeek } from "../../models/DayOfWeek";
import { GradeLevel } from "../../models/GradeLevel";
import NewStudentPanel from "./NewStudentPanel";
import { AxiosError } from "axios";
import { AppContext } from "../../AppContextProvider";
import {
  associateStudentWithUser,
  createStudent,
  StudentWithLunchTimes,
} from "../../api/CafeteriaClient";
import { DateTimeUtils } from "../../DateTimeUtils";

interface DialogProps {
  parent: User;
  onClose: () => void;
}

const AdminNewStudentDialog: React.FC<DialogProps> = ({ parent, onClose }) => {
  const {
    students,
    setStudents,
    setSnackbarErrorMsg,
    schoolYears,
    currentSchoolYear,
    setCurrentSchoolYear,
    setSchoolYears,
    users,
  } = useContext(AppContext);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentFirstName, setStudentFirstName] = useState<string>("");
  const [studentLastName, setStudentLastName] = useState<string>("");
  const [studentBirthDate, setStudentBirthDate] = useState<Dayjs | null>(null);
  const [create, setCreate] = useState(true);

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

  // State for confirmation dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [existingStudent, setExistingStudent] = useState<Student | null>(null);
  const [existingParentName, setExistingParentName] = useState<string>("");

  const isSaveDisabled = create
    ? !studentFirstName.length || !studentLastName.length || !studentBirthDate
    : !selectedStudent;

  const handleCreateStudent = async () => {
    // Check if there's an existing student with the same firstName, lastName, and grade
    const existingStudent = students.find(
      (student) =>
        student.firstName.toLowerCase() === studentFirstName.toLowerCase() &&
        student.lastName.toLowerCase() === studentLastName.toLowerCase() &&
        currentSchoolYear.studentLunchTimes.some(
          (lt) =>
            lt.studentId === student.id &&
            lt.dayOfWeek === DayOfWeek.MONDAY &&
            lt.grade === selectedGrade
        )
    );

    if (existingStudent) {
      // Check if the current parent is already associated with this student
      if (existingStudent.parents.includes(parent.id)) {
        // Parent is already associated, do nothing
        onClose();
        return;
      }

      // Find the existing parent name
      const existingParent = users.find((user) => 
        existingStudent.parents.includes(user.id)
      );
      const existingParentName = existingParent 
        ? `${existingParent.firstName} ${existingParent.lastName}`
        : "Unknown Parent";

      // Show confirmation dialog
      setExistingStudent(existingStudent);
      setExistingParentName(existingParentName);
      setShowConfirmDialog(true);
      return;
    }

    // No existing student found, proceed with creation
    await createNewStudent();
  };

  const createNewStudent = async () => {
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
      birthDate: studentBirthDate
        ? DateTimeUtils.toString(studentBirthDate.toDate())
        : "",
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
      updatedSchoolYear.studentLunchTimes = currentSchoolYear.studentLunchTimes
        .filter((lt) => lt.studentId !== savedStudent.id)
        .concat(
          lunchTimes.map((lt) => ({ ...lt, studentId: savedStudent.id }))
        );

      setCurrentSchoolYear(updatedSchoolYear);
      setSchoolYears(
        schoolYears.map((sy) =>
          sy.id !== updatedSchoolYear.id ? sy : updatedSchoolYear
        )
      );
    }

    onClose();
  };

  const handleAddExistingStudent = async () => {
    // Check if the user is already a parent of the selected student
    if (selectedStudent && selectedStudent.parents.includes(parent.id)) {
      // User is already a parent of this student, do nothing
      onClose();
      return;
    }

    await associateStudentWithUser(selectedStudent!.id, parent.id);
  };

  const handleSaveStudent = async () => {
    try {
      if (create) {
        await handleCreateStudent();
      } else {
        await handleAddExistingStudent();
      }
      onClose();
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

  const handleModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCreate(event.target.value === "create");
  };

  const handleConfirmCreate = async () => {
    setShowConfirmDialog(false);
    await createNewStudent();
  };

  const handleCancelCreate = () => {
    setShowConfirmDialog(false);
    setExistingStudent(null);
    setExistingParentName("");
  };

  return (
    <>
      <Dialog
        open={true}
        onClose={() => onClose()}
        fullWidth={true}
        maxWidth="sm"
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle>Add / Create Student</DialogTitle>
        <DialogContent sx={{ minHeight: "400px" }}>
          <Stack mb={2} direction="row" spacing={2}>
            <Typography fontWeight="bold" variant="body1" gutterBottom>
              Parent:
            </Typography>
            <Typography variant="body1" gutterBottom>
              {parent.firstName} {parent.lastName}
            </Typography>
          </Stack>
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend">Student Option</FormLabel>
            <RadioGroup
              row
              value={create ? "create" : "existing"}
              onChange={handleModeChange}
            >
              <FormControlLabel
                value="create"
                control={<Radio />}
                label="Create New Student"
              />
              <FormControlLabel
                value="existing"
                control={<Radio />}
                label="Add Existing Student"
              />
            </RadioGroup>
          </FormControl>

          {create && (
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
          )}
          {!create && (
            <Box pt={1}>
              <StudentAutoCompleteSelector
                value={selectedStudent}
                onChange={setSelectedStudent}
                label="Select Student"
              />
            </Box>
          )}
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

      {/* Confirmation Dialog for Existing Student */}
      <Dialog
        open={showConfirmDialog}
        onClose={handleCancelCreate}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Student Already Exists</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            A student with the name &ldquo;{existingStudent?.firstName} {existingStudent?.lastName}&rdquo; 
            in grade {selectedGrade} already exists and is associated with {existingParentName}.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Do you want to create a new student record anyway? This will create a separate 
            student entry that you can manage independently.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelCreate}>Cancel</Button>
          <Button onClick={handleConfirmCreate} variant="contained">
            Create New Student
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminNewStudentDialog;
