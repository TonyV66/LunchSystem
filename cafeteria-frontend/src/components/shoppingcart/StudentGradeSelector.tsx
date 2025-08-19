import React, { useContext, useState } from "react";
import {
  FormControl,
  InputLabel,
  MenuItem as MuiMenuItem,
  Select,
  Typography,
} from "@mui/material";
import { GradeLevel } from "../../models/GradeLevel";
import Student from "../../models/Student";
import { AppContext } from "../../AppContextProvider";

interface StudentGradeSelectorProps {
  student?: Student;
  onGradeSelected: (grade: GradeLevel) => void;
}

const StudentGradeSelector: React.FC<StudentGradeSelectorProps> = ({
  student,
  onGradeSelected,
}) => {
  const { currentSchoolYear } = useContext(AppContext);
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(
    currentSchoolYear.id
      ? currentSchoolYear.studentLunchTimes.find(
          (slt) => slt.studentId === student?.id
        )?.grade ?? GradeLevel.UNKNOWN
      : GradeLevel.UNKNOWN
  );
  const handleGradeSelected = (grade: GradeLevel) => {
    setSelectedGrade(grade);
    onGradeSelected(grade);
  };

  return (
    <FormControl variant="standard" id="student-grade-selector">
      <InputLabel id="student-grade-label">Grade</InputLabel>
      <Select
        labelId="student-grade-label"
        id="student-grade"
        variant="standard"
        value={selectedGrade}
        label="Grade"
        onChange={(e) => handleGradeSelected(e.target.value as GradeLevel)}
      >
        {selectedGrade === GradeLevel.UNKNOWN ? (
          <MuiMenuItem disabled={true} value={GradeLevel.UNKNOWN}>
            <Typography color="textDisabled">Select a grade</Typography>
          </MuiMenuItem>
        ) : (
          <></>
        )}
        <MuiMenuItem value={GradeLevel.PRE_K2}>Pre-K2</MuiMenuItem>
        <MuiMenuItem value={GradeLevel.PRE_K3}>Pre-K3</MuiMenuItem>
        <MuiMenuItem value={GradeLevel.PRE_K4}>Pre-K4</MuiMenuItem>
        <MuiMenuItem value={GradeLevel.PRE_K}>Pre-K</MuiMenuItem>
        <MuiMenuItem value={GradeLevel.KINDERGARTEN}>Kindergarten</MuiMenuItem>
        <MuiMenuItem value={GradeLevel.FIRST}>1st Grade</MuiMenuItem>
        <MuiMenuItem value={GradeLevel.SECOND}>2nd Grade</MuiMenuItem>
        <MuiMenuItem value={GradeLevel.THIRD}>3rd Grade</MuiMenuItem>
        <MuiMenuItem value={GradeLevel.FOURTH}>4th Grade</MuiMenuItem>
        <MuiMenuItem value={GradeLevel.FIFTH}>5th Grade</MuiMenuItem>
        <MuiMenuItem value={GradeLevel.SIXTH}>6th Grade</MuiMenuItem>
        <MuiMenuItem value={GradeLevel.SEVENTH}>7th Grade</MuiMenuItem>
        <MuiMenuItem value={GradeLevel.EIGHTH}>8th Grade</MuiMenuItem>
        <MuiMenuItem value={GradeLevel.NINTH}>9th Grade</MuiMenuItem>
        <MuiMenuItem value={GradeLevel.TENTH}>10th Grade</MuiMenuItem>
        <MuiMenuItem value={GradeLevel.ELEVENTH}>11th Grade</MuiMenuItem>
        <MuiMenuItem value={GradeLevel.TWELFTH}>12th Grade</MuiMenuItem>
      </Select>
    </FormControl>
  );
};

export default StudentGradeSelector;
