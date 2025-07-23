import React, { useContext, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Box,
} from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import {
  StudentWithLunchTimes,
  getRelations,
  Relations,
} from "../../api/CafeteriaClient";
import Student from "../../models/Student";
import { AxiosError } from "axios";
import { GradeLevel } from "../../models/GradeLevel";
import User from "../../models/User";
import StudentGradeSelector from "../shoppingcart/StudentGradeSelector";
import ExistingStudentDialog from "./ExistingStudentDialog";
import TeacherSelector from "../shoppingcart/TeacherSelector";
import { DayOfWeek } from "../../models/DayOfWeek";
import { StudentLunchTime } from "../../models/StudentLunchTime";

interface DialogProps {
  onCreateStudent: (
    student: Student,
    studentLunchTimes: StudentLunchTime[]
  ) => void;
  onAddStudent: (student: Student) => void;
  onClose: () => void;
  dayOfWeek: DayOfWeek;
}

const NewFamilyMemberDialog: React.FC<DialogProps> = ({
  onClose,
  onCreateStudent,
  onAddStudent,
  dayOfWeek,
}) => {
  const { currentSchoolYear, setSnackbarErrorMsg } = useContext(AppContext);

  const [studentFirstName, setStudentFirstName] = useState<string>("");
  const [studentLastName, setStudentLastName] = useState<string>("");

  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>();
  const [selectedTeacher, setSelectedTeacher] = useState<number>();

  // State for existing student dialog
  const [relations, setRelations] = useState<Relations>();
  const [pendingStudentData, setPendingStudentData] =
    useState<StudentWithLunchTimes | null>(null);

  const handleCreateStudent = async () => {
    try {
      const studentToSave: StudentWithLunchTimes = {
        id: 0,
        name: studentFirstName,
        firstName: studentFirstName,
        lastName: studentLastName,
        birthDate: "",
        studentId: "",
        parents: [],
      };

      // Check for existing students with the same name and grade
      const relations = await getRelations(
        studentFirstName,
        studentLastName,
        selectedGrade!
      );

      if (relations.parents.length > 0) {
        // Show dialog for existing student
        setRelations(relations);
        setPendingStudentData(studentToSave);
        return;
      }

      const studentLunchTimes: StudentLunchTime[] = [];
      studentLunchTimes.push({
        studentId: 0,
        grade: selectedGrade!,
        dayOfWeek: DayOfWeek.MONDAY,
        teacherId:
          currentSchoolYear.gradesAssignedByClass.includes(selectedGrade!) &&
          currentSchoolYear.oneTeacherPerStudent
            ? selectedTeacher
            : undefined,
      });
      studentLunchTimes.push({
        studentId: 0,
        grade: selectedGrade!,
        dayOfWeek: DayOfWeek.TUESDAY,
        teacherId:
          currentSchoolYear.gradesAssignedByClass.includes(selectedGrade!) &&
          currentSchoolYear.oneTeacherPerStudent
            ? selectedTeacher
            : undefined,
      });
      studentLunchTimes.push({
        studentId: 0,
        grade: selectedGrade!,
        dayOfWeek: DayOfWeek.WEDNESDAY,
        teacherId:
          currentSchoolYear.gradesAssignedByClass.includes(selectedGrade!) &&
          currentSchoolYear.oneTeacherPerStudent
            ? selectedTeacher
            : undefined,
      });
      studentLunchTimes.push({
        studentId: 0,
        grade: selectedGrade!,
        dayOfWeek: DayOfWeek.THURSDAY,
        teacherId:
          currentSchoolYear.gradesAssignedByClass.includes(selectedGrade!) &&
          currentSchoolYear.oneTeacherPerStudent
            ? selectedTeacher
            : undefined,
      });
      studentLunchTimes.push({
        studentId: 0,
        grade: selectedGrade!,
        dayOfWeek: DayOfWeek.FRIDAY,
        teacherId:
          currentSchoolYear.gradesAssignedByClass.includes(selectedGrade!) &&
          currentSchoolYear.oneTeacherPerStudent
            ? selectedTeacher
            : undefined,
      });

      // No existing students found, create the new student
      onCreateStudent(studentToSave, studentLunchTimes);
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

  const handleStudentSelection = async (selectedParent: User | null) => {
    if (selectedParent === null && pendingStudentData) {
      const studentLunchTimes: StudentLunchTime[] = [];
      if (
        selectedGrade !== undefined &&
        selectedGrade !== GradeLevel.UNKNOWN &&
        currentSchoolYear.oneTeacherPerStudent
      ) {
        if (selectedTeacher) {
          studentLunchTimes.push({
            studentId: 0,
            grade: selectedGrade,
            dayOfWeek: DayOfWeek.MONDAY,
            teacherId: currentSchoolYear.gradesAssignedByClass.includes(
              selectedGrade
            )
              ? selectedTeacher
              : undefined,
          });
          studentLunchTimes.push({
            studentId: 0,
            grade: selectedGrade,
            dayOfWeek: DayOfWeek.TUESDAY,
            teacherId: currentSchoolYear.gradesAssignedByClass.includes(
              selectedGrade
            )
              ? selectedTeacher
              : undefined,
          });
          studentLunchTimes.push({
            studentId: 0,
            grade: selectedGrade,
            dayOfWeek: DayOfWeek.WEDNESDAY,
            teacherId: currentSchoolYear.gradesAssignedByClass.includes(
              selectedGrade
            )
              ? selectedTeacher
              : undefined,
          });
          studentLunchTimes.push({
            studentId: 0,
            grade: selectedGrade,
            dayOfWeek: DayOfWeek.THURSDAY,
            teacherId: currentSchoolYear.gradesAssignedByClass.includes(
              selectedGrade
            )
              ? selectedTeacher
              : undefined,
          });
          studentLunchTimes.push({
            studentId: 0,
            grade: selectedGrade,
            dayOfWeek: DayOfWeek.FRIDAY,
            teacherId: currentSchoolYear.gradesAssignedByClass.includes(
              selectedGrade
            )
              ? selectedTeacher
              : undefined,
          });
        }
      }

      onCreateStudent(pendingStudentData, studentLunchTimes);
    } else if (selectedParent && relations) {
      const student = relations.students.find((s) =>
        s.parents.includes(selectedParent.id)
      )!;
      onAddStudent(student);
    }

    setPendingStudentData(null);
    setRelations(undefined);
  };

  const handleCloseExistingDialog = () => {
    setRelations(undefined);
    setPendingStudentData(null);
  };

  const isTeacherSelectionRequired =
    !!selectedGrade &&
    currentSchoolYear?.oneTeacherPerStudent &&
    currentSchoolYear.gradesAssignedByClass.includes(selectedGrade);

  const isSaveDisabled =
    !studentFirstName.length ||
    !studentLastName.length ||
    !selectedGrade ||
    (isTeacherSelectionRequired && !selectedTeacher);

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
        <DialogTitle>Add Student</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
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

            <StudentGradeSelector onGradeSelected={setSelectedGrade} />
            {currentSchoolYear.oneTeacherPerStudent &&
              currentSchoolYear.gradesAssignedByClass.includes(
                selectedGrade!
              ) && (
                <TeacherSelector
                  schoolYear={currentSchoolYear!}
                  grade={selectedGrade}
                  dayOfWeek={dayOfWeek}
                  onTeacherSelected={setSelectedTeacher}
                />
              )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => onClose()}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateStudent}
            disabled={isSaveDisabled}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {relations !== undefined && (
        <ExistingStudentDialog
          relations={relations}
          onClose={handleCloseExistingDialog}
          onSelectParent={handleStudentSelection}
        />
      )}
    </>
  );
};

export default NewFamilyMemberDialog;
