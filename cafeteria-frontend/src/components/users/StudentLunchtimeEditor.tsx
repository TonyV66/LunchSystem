import React from "react";
import { Box, FormHelperText, Stack, Typography } from "@mui/material";
import { getGradeName, GradeLevel } from "../../models/GradeLevel";
import { DayOfWeek } from "../../models/DayOfWeek";
import User from "../../models/User";
import StudentGradeSelector from "../shoppingcart/StudentGradeSelector";
import TeacherSelector from "../shoppingcart/TeacherSelector";
import SchoolYear from "../../models/SchoolYear";

interface Props {
  schoolYear?: SchoolYear;
  selectedGrade: GradeLevel;
  selectedTeachers: Record<DayOfWeek, number | null>;
  teachers: User[];
  onGradeSelected: (grade: GradeLevel) => void;
  onTeacherChange: (day: DayOfWeek, teacherId: number) => void;
}

const StudentLunchtimeEditor: React.FC<Props> = ({
  schoolYear,
  selectedGrade,
  selectedTeachers,
  teachers,
  onGradeSelected,
  onTeacherChange,
}) => {
  const isGradeByClassroom = (grade: GradeLevel): boolean => {
    return schoolYear?.gradesAssignedByClass.includes(grade) ?? false;
  };

  return (
    <Stack gap={2} direction="column">
      <StudentGradeSelector
        selectedGrade={selectedGrade}
        onGradeSelected={onGradeSelected}
      />

      {isGradeByClassroom(selectedGrade) && (
        <>
          <FormHelperText>Note: {getGradeName(selectedGrade)} students are assigned a lunchtime teacher. Failure to identify teachers may result in your student not appearing on their teacher&apos;s daily lunch report.</FormHelperText>
          <Box sx={{ flexGrow: 1, mt: 1 }}>
            <Stack direction="column" gap={1}>
              <Typography fontWeight="bold" variant="body2" gutterBottom>
                Lunchtime Teachers
              </Typography>

              {Object.entries(selectedTeachers)
                .filter(
                  ([day]) =>
                    parseInt(day) !== DayOfWeek.SATURDAY &&
                    parseInt(day) !== DayOfWeek.SUNDAY
                )
                .map(([day, teacherId]) => (
                  <TeacherSelector
                    key={day}
                    selectedTeacher={teachers.find((t) => t.id === teacherId)}
                    teachers={teachers}
                    dayOfWeek={parseInt(day)}
                    onTeacherSelected={(id) =>
                      onTeacherChange(parseInt(day), id)
                    }
                  />
                ))}
            </Stack>
          </Box>
        </>
      )}
    </Stack>
  );
};

export default StudentLunchtimeEditor;
