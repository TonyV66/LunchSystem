import React, { useContext, useState } from "react";
import { Box, FormHelperText, Stack, Typography } from "@mui/material";
import { getGradeName, GradeLevel } from "../../models/GradeLevel";
import { DayOfWeek } from "../../models/DayOfWeek";
import StudentGradeSelector from "../shoppingcart/StudentGradeSelector";
import TeacherSelector from "../shoppingcart/TeacherSelector";
import Student from "../../models/Student";
import { AppContext } from "../../AppContextProvider";
import { StudentLunchTime } from "../../models/StudentLunchTime";

interface Props {
  student?: Student;
  gradeLevel?: GradeLevel;
  onLunchtimesChanged: (lunchTimes: StudentLunchTime[]) => void;
}

const StudentLunchtimeEditor: React.FC<Props> = ({
  student,
  gradeLevel,
  onLunchtimesChanged,
}) => {
  const { currentSchoolYear } = useContext(AppContext);
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(
    gradeLevel ?? currentSchoolYear.id
      ? currentSchoolYear.studentLunchTimes.find(
          (slt) => slt.studentId === student?.id
        )?.grade ?? GradeLevel.UNKNOWN
      : GradeLevel.UNKNOWN
  );
  const [mondayTeacher, setMondayTeacher] = useState<number | undefined>(
    currentSchoolYear.studentLunchTimes.find(
      (slt) =>
        slt.studentId === student?.id && slt.dayOfWeek === DayOfWeek.MONDAY
    )?.teacherId
  );
  const [tuesdayTeacher, setTuesdayTeacher] = useState<number | undefined>(
    currentSchoolYear.studentLunchTimes.find(
      (slt) =>
        slt.studentId === student?.id && slt.dayOfWeek === DayOfWeek.TUESDAY
    )?.teacherId
  );
  const [wednesdayTeacher, setWednesdayTeacher] = useState<number | undefined>(
    currentSchoolYear.studentLunchTimes.find(
      (slt) =>
        slt.studentId === student?.id && slt.dayOfWeek === DayOfWeek.WEDNESDAY
    )?.teacherId
  );
  const [thursdayTeacher, setThursdayTeacher] = useState<number | undefined>(
    currentSchoolYear.studentLunchTimes.find(
      (slt) =>
        slt.studentId === student?.id && slt.dayOfWeek === DayOfWeek.THURSDAY
    )?.teacherId
  );
  const [fridayTeacher, setFridayTeacher] = useState<number | undefined>(
    currentSchoolYear.studentLunchTimes.find(
      (slt) =>
        slt.studentId === student?.id && slt.dayOfWeek === DayOfWeek.FRIDAY
    )?.teacherId
  );

  const isGradeByClassroom = (grade: GradeLevel): boolean => {
    return currentSchoolYear?.gradesAssignedByClass.includes(grade) ?? false;
  };

  const handleTeacherChanged = (day: DayOfWeek, teacherId: number) => {
    const studentLunchTimes: StudentLunchTime[] = [];
    switch (day) {
      case DayOfWeek.MONDAY:
        setMondayTeacher(teacherId);
        break;
      case DayOfWeek.TUESDAY:
        setTuesdayTeacher(teacherId);
        break;
      case DayOfWeek.WEDNESDAY:
        setWednesdayTeacher(teacherId);
        break;
      case DayOfWeek.THURSDAY:
        setThursdayTeacher(teacherId);
        break;
      case DayOfWeek.FRIDAY:
        setFridayTeacher(teacherId);
        break;
    }
    if (selectedGrade !== GradeLevel.UNKNOWN) {
      if (mondayTeacher) {
        studentLunchTimes.push({
          studentId: student?.id ?? 0,
          grade: selectedGrade,
          dayOfWeek: DayOfWeek.MONDAY,
          teacherId: mondayTeacher,
        });
      }
      if (tuesdayTeacher) {
        studentLunchTimes.push({
          studentId: student?.id ?? 0,
          grade: selectedGrade,
          dayOfWeek: DayOfWeek.TUESDAY,
          teacherId: tuesdayTeacher,
        });
      }
      if (wednesdayTeacher) {
        studentLunchTimes.push({
          studentId: student?.id ?? 0,
          grade: selectedGrade,
          dayOfWeek: DayOfWeek.WEDNESDAY,
          teacherId: wednesdayTeacher,
        });
      }
      if (thursdayTeacher) {
        studentLunchTimes.push({
          studentId: student?.id ?? 0,
          grade: selectedGrade,
          dayOfWeek: DayOfWeek.THURSDAY,
          teacherId: thursdayTeacher,
        });
      }
      if (fridayTeacher) {
        studentLunchTimes.push({
          studentId: student?.id ?? 0,
          grade: selectedGrade,
          dayOfWeek: DayOfWeek.FRIDAY,
          teacherId: fridayTeacher,
        });
      }
    }
    onLunchtimesChanged(studentLunchTimes);
  };

  const handleGradeSelected = (grade: GradeLevel) => {
    setSelectedGrade(grade);
    const studentLunchTimes: StudentLunchTime[] = [];
    if (selectedGrade !== GradeLevel.UNKNOWN) {
      if (mondayTeacher) {
        studentLunchTimes.push({
          studentId: student?.id ?? 0,
          grade: grade,
          dayOfWeek: DayOfWeek.MONDAY,
          teacherId: isGradeByClassroom(grade) ? mondayTeacher : undefined,
        });
      }
      if (tuesdayTeacher) {
        studentLunchTimes.push({
          studentId: student?.id ?? 0,
          grade: grade,
          dayOfWeek: DayOfWeek.TUESDAY,
          teacherId: isGradeByClassroom(grade) ? tuesdayTeacher : undefined,
        });
      }
      if (wednesdayTeacher) {
        studentLunchTimes.push({
          studentId: student?.id ?? 0,
          grade: grade,
          dayOfWeek: DayOfWeek.WEDNESDAY,
          teacherId: isGradeByClassroom(grade) ? wednesdayTeacher : undefined,
        });
      }
      if (thursdayTeacher) {
        studentLunchTimes.push({
          studentId: student?.id ?? 0,
          grade: grade,
          dayOfWeek: DayOfWeek.THURSDAY,
          teacherId: isGradeByClassroom(grade) ? thursdayTeacher : undefined,
        });
      }
      if (fridayTeacher) {
        studentLunchTimes.push({
          studentId: student?.id ?? 0,
          grade: grade,
          dayOfWeek: DayOfWeek.FRIDAY,
          teacherId: isGradeByClassroom(grade) ? fridayTeacher : undefined,
        });
      }
    }
    onLunchtimesChanged(studentLunchTimes);
  };

  return (
    <Stack gap={2} direction="column">
      {gradeLevel === undefined && (
        <StudentGradeSelector
          student={student}
          onGradeSelected={handleGradeSelected}
        />
      )}

      {selectedGrade !== undefined && isGradeByClassroom(selectedGrade) && (
        <>
          <FormHelperText>
            Note: {getGradeName(selectedGrade)} students are assigned a
            lunchtime teacher. Failure to identify teachers may result in your
            student not appearing on their teacher&apos;s daily lunch report.
          </FormHelperText>
          <Box sx={{ flexGrow: 1, mt: 1 }}>
            <Stack direction="column" gap={1}>
              <Typography fontWeight="bold" variant="body2" gutterBottom>
                Lunchtime Teachers
              </Typography>

              <TeacherSelector
                student={student}
                schoolYear={currentSchoolYear!}
                grade={!student ? selectedGrade : undefined}
                dayOfWeek={DayOfWeek.MONDAY}
                onTeacherSelected={(id) =>
                  handleTeacherChanged(DayOfWeek.MONDAY, id)
                }
              />
              <TeacherSelector
                student={student}
                schoolYear={currentSchoolYear!}
                grade={!student ? selectedGrade : undefined}
                dayOfWeek={DayOfWeek.TUESDAY}
                onTeacherSelected={(id) =>
                  handleTeacherChanged(DayOfWeek.TUESDAY, id)
                }
              />
              <TeacherSelector
                student={student}
                schoolYear={currentSchoolYear!}
                grade={!student ? selectedGrade : undefined}
                dayOfWeek={DayOfWeek.WEDNESDAY}
                onTeacherSelected={(id) =>
                  handleTeacherChanged(DayOfWeek.WEDNESDAY, id)
                }
              />
              <TeacherSelector
                student={student}
                schoolYear={currentSchoolYear!}
                grade={!student ? selectedGrade : undefined}
                dayOfWeek={DayOfWeek.THURSDAY}
                onTeacherSelected={(id) =>
                  handleTeacherChanged(DayOfWeek.THURSDAY, id)
                }
              />
              <TeacherSelector
                student={student}
                grade={!student ? selectedGrade : undefined}
                schoolYear={currentSchoolYear!}
                dayOfWeek={DayOfWeek.FRIDAY}
                onTeacherSelected={(id) =>
                  handleTeacherChanged(DayOfWeek.FRIDAY, id)
                }
              />
            </Stack>
          </Box>
        </>
      )}
    </Stack>
  );
};

export default StudentLunchtimeEditor;
