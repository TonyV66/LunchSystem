import React, { useContext, useEffect, useState } from "react";
import {
  FormControl,
  InputLabel,
  MenuItem as MuiMenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import User, { Role } from "../../models/User";
import { DAY_NAMES } from "../../DateTimeUtils";
import { AppContext } from "../../AppContextProvider";
import SchoolYear from "../../models/SchoolYear";
import Student from "../../models/Student";
import { DayOfWeek } from "../../models/DayOfWeek";
import { GradeLevel } from "../../models/GradeLevel";

interface TeacherSelectorProps {
  schoolYear: SchoolYear;
  student?: Student;
  grade?: GradeLevel;
  dayOfWeek: DayOfWeek;
  onTeacherSelected: (teacherId: number) => void;
}

const TeacherSelector: React.FC<TeacherSelectorProps> = ({
  schoolYear,
  student,
  grade,
  dayOfWeek,
  onTeacherSelected,
}) => {
  const { users } = useContext(AppContext);
  const [selectedTeacher, setSelectedTeacher] = useState<User>();
  const [availableTeachers, setAvailableTeachers] = useState<User[]>([]);

  useEffect(() => {
    const studentGradeLevel = grade ?? schoolYear.studentLunchTimes.find(
      (lt) => lt.studentId === student?.id && lt.dayOfWeek === dayOfWeek
    )!.grade;

    const gradeLevelTeachers = users.filter(
      (u) =>
        u.role === Role.TEACHER &&
        u.id ===
          schoolYear.teacherLunchTimes.find(
            (lt) => lt.teacherId === u.id && lt.dayOfWeek === dayOfWeek && lt.grades.length && lt.grades[0] === studentGradeLevel && lt.times.length > 0
          )?.teacherId
    ).sort((t1, t2) =>
      t1.name.toLowerCase().localeCompare(t2.name.toLowerCase())
    );

    let studentsTeacher = !student?.id ? undefined : gradeLevelTeachers.find(
      (u) =>
        u.id ===
          schoolYear.studentLunchTimes.find(
            (lt) => lt.studentId === student?.id && lt.dayOfWeek === dayOfWeek
          )?.teacherId
    );
    if (!studentsTeacher && gradeLevelTeachers.length == 1) {
      studentsTeacher = gradeLevelTeachers[0];
    }

    setSelectedTeacher(studentsTeacher);
    setAvailableTeachers(gradeLevelTeachers);

  }, [schoolYear, grade, dayOfWeek, student?.id]);

  const handleTeacherSelected = (teacherId: number) => {
    setSelectedTeacher(availableTeachers.find((t) => t.id === teacherId));
    onTeacherSelected(teacherId);
  };

  return (
    <FormControl variant="standard" sx={{ minWidth: "150px" }}>
      <InputLabel id="order-teacher-label">{grade !== undefined ? 'Lunchtime Teacher' : DAY_NAMES[dayOfWeek]}</InputLabel>
      <Select
        labelId="order-teacher-label"
        id="order-teacher"
        variant="standard"
        disabled={selectedTeacher !== undefined && availableTeachers.length == 1}
        value={selectedTeacher?.id.toString() || "0"}
        label="Lunchtime Teacher"
        onChange={(event: SelectChangeEvent) =>
          handleTeacherSelected(parseInt(event.target.value as string))
        }
      >
        {!selectedTeacher && availableTeachers.length != 1 ? (
          <MuiMenuItem disabled={true} key={0} value={"0"}>
            <Typography color="textDisabled">Select a teacher</Typography>
          </MuiMenuItem>
        ) : (
          <></>
        )}

        {availableTeachers.map((teacher) => (
          <MuiMenuItem key={teacher.id} value={teacher.id.toString()}>
            {teacher.name}
          </MuiMenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default TeacherSelector;
