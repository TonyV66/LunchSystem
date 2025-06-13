import React, { useContext } from "react";
import { Stack, Typography } from "@mui/material";
import { getGradeName, GradeLevel } from "../../models/GradeLevel";
import { DayOfWeek } from "../../models/DayOfWeek";
import SchoolYear from "../../models/SchoolYear";
import Student from "../../models/Student";
import { AppContext } from "../../AppContextProvider";
import { Role } from "../../models/User";

interface Props {
  schoolYear: SchoolYear;
  student?: Student;
  dayOfWeek: DayOfWeek;
}


const StudentLunchtimePanel: React.FC<Props> = ({
  schoolYear,
  student,
  dayOfWeek,
}) => {
  
  const { users } = useContext(AppContext);
  const teachers = users.filter((user) => user.role === Role.TEACHER);

  const studentLunchTime = student
    ? schoolYear.studentLunchTimes.find(
        (lt) => lt.studentId === student.id && lt.dayOfWeek === dayOfWeek
      )
    : undefined;

  const gradeLevel =
    schoolYear.studentLunchTimes.find((lt) => lt.studentId === student?.id)
      ?.grade ?? GradeLevel.UNKNOWN;
  const gradeDisplayName = getGradeName(gradeLevel);

  const isGradeByClassroom =
    schoolYear.gradesAssignedByClass.includes(gradeLevel);
  const teacher = studentLunchTime?.teacherId
    ? teachers.find((t) => t.id === studentLunchTime.teacherId)
    : undefined;
  const teacherDisplayName = teacher?.name ?? "Unknown";

  return (
    <Stack direction="row" gap={2}>
      <Stack direction="row" gap={1}>
        <Typography fontWeight="bold" variant="body2">
          Grade:
        </Typography>
        <Typography variant="body2">{gradeDisplayName}</Typography>
      </Stack>
      {gradeLevel && isGradeByClassroom && (
        <Stack direction="row" gap={1}>
          <Typography fontWeight="bold" variant="body2">
            Lunchtime Teacher:
          </Typography>
          <Typography variant="body2">{teacherDisplayName}</Typography>
        </Stack>
      )}
    </Stack>
  );
};

export default StudentLunchtimePanel;
