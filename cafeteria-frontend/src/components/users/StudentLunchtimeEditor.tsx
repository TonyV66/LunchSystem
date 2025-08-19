import React, { useContext, useState } from "react";
import { Stack } from "@mui/material";
import { GradeLevel } from "../../models/GradeLevel";
import { DayOfWeek } from "../../models/DayOfWeek";
import StudentGradeSelector from "../shoppingcart/StudentGradeSelector";
import TeacherSelector from "../shoppingcart/TeacherSelector";
import Student from "../../models/Student";
import { AppContext } from "../../AppContextProvider";
import { StudentLunchTime } from "../../models/StudentLunchTime";
import User from "../../models/User";

interface Props {
  student?: Student;
  onLunchtimesChanged: (lunchTimes: StudentLunchTime[]) => void;
}

const StudentLunchtimeEditor: React.FC<Props> = ({
  student,
  onLunchtimesChanged,
}) => {
  const { currentSchoolYear, users } = useContext(AppContext);
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(
    currentSchoolYear.id
      ? currentSchoolYear.studentLunchTimes.find(
          (slt) => slt.studentId === student?.id
        )?.grade ?? GradeLevel.UNKNOWN
      : GradeLevel.UNKNOWN
  );

  const [selectedTeacher, setSelectedTeacher] = useState<User | undefined>(
    users.find((user) =>
      user.id === currentSchoolYear.id
        ? currentSchoolYear.studentLunchTimes.find(
            (slt) => slt.studentId === student?.id
          )?.teacherId ?? 0
        : 0
    )
  );

  const isGradeByClassroom = (grade: GradeLevel): boolean => {
    return currentSchoolYear?.gradesAssignedByClass.includes(grade) ?? false;
  };

  const handleTeacherChanged = (teacherId: number) => {
    const teacher = users.find((user) => user.id === teacherId)!;
    setSelectedTeacher(teacher);
    const studentLunchTimes: StudentLunchTime[] = [];
    if (selectedGrade !== GradeLevel.UNKNOWN && teacher) {
      studentLunchTimes.push({
        studentId: student?.id ?? 0,
        grade: selectedGrade,
        dayOfWeek: DayOfWeek.MONDAY,
        teacherId: teacher.id,
      });
      studentLunchTimes.push({
        studentId: student?.id ?? 0,
        grade: selectedGrade,
        dayOfWeek: DayOfWeek.TUESDAY,
        teacherId: teacher.id,
      });
      studentLunchTimes.push({
        studentId: student?.id ?? 0,
        grade: selectedGrade,
        dayOfWeek: DayOfWeek.WEDNESDAY,
        teacherId: teacher.id,
      });
      studentLunchTimes.push({
        studentId: student?.id ?? 0,
        grade: selectedGrade,
        dayOfWeek: DayOfWeek.THURSDAY,
        teacherId: teacher.id,
      });
      studentLunchTimes.push({
        studentId: student?.id ?? 0,
        grade: selectedGrade,
        dayOfWeek: DayOfWeek.FRIDAY,
        teacherId: teacher.id,
      });
    }
    onLunchtimesChanged(studentLunchTimes);
  };

  const handleGradeSelected = (grade: GradeLevel) => {
    setSelectedGrade(grade);
    setSelectedTeacher(undefined);
    const studentLunchTimes: StudentLunchTime[] = [];
    if (!isGradeByClassroom(grade)) {
      studentLunchTimes.push({
        studentId: student?.id ?? 0,
        grade: grade,
        dayOfWeek: DayOfWeek.MONDAY,
      });
      studentLunchTimes.push({
        studentId: student?.id ?? 0,
        grade: grade,
        dayOfWeek: DayOfWeek.TUESDAY,
      });
      studentLunchTimes.push({
        studentId: student?.id ?? 0,
        grade: grade,
        dayOfWeek: DayOfWeek.WEDNESDAY,
      });
      studentLunchTimes.push({
        studentId: student?.id ?? 0,
        grade: grade,
        dayOfWeek: DayOfWeek.THURSDAY,
      });
      studentLunchTimes.push({
        studentId: student?.id ?? 0,
        grade: grade,
        dayOfWeek: DayOfWeek.FRIDAY,
      });
    }
    onLunchtimesChanged(studentLunchTimes);
  };

  return (
    <Stack gap={2} direction="column">
      <StudentGradeSelector
        student={student}
        onGradeSelected={handleGradeSelected}
      />

      {selectedGrade && isGradeByClassroom(selectedGrade) && (
        <TeacherSelector
          student={student}
          schoolYear={currentSchoolYear!}
          grade={selectedGrade || undefined}
          dayOfWeek={DayOfWeek.MONDAY}
          onTeacherSelected={(id) => handleTeacherChanged(id)}
        />
      )}
    </Stack>
  );
};

export default StudentLunchtimeEditor;
