import * as React from "react";
import { Box, Typography } from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import Meal from "../../models/Meal";
import Student from "../../models/Student";
import { DateTimeFormat, DateTimeUtils } from "../../DateTimeUtils";
import User, { Role } from "../../models/User";
import { getMealsAtTime, getMealsWithIrregularTimes } from "../../ReportUtils";
import { getGradeName, GradeLevel } from "../../models/GradeLevel";

interface StudentMealReportProps {
  student: Student;
  date: string;
}

interface StaffMealReportProps {
  staffMember: User;
  date: string;
}

interface MealReportProps {
  meals: Meal[];
  title: string;
}

interface Classroom {
  teacher: User;
  grade: GradeLevel;
  students: Student[];
}

interface GradeLevelStudents {
  gradeLevel: GradeLevel;
  students: Student[];
}

const gradeOrder = [
  GradeLevel.PRE_K2,
  GradeLevel.PRE_K3,
  GradeLevel.PRE_K4,
  GradeLevel.PRE_K,
  GradeLevel.KINDERGARTEN,
  GradeLevel.FIRST,
  GradeLevel.SECOND,
  GradeLevel.THIRD,
  GradeLevel.FOURTH,
  GradeLevel.FIFTH,
  GradeLevel.SIXTH,
  GradeLevel.SEVENTH,
  GradeLevel.EIGHTH,
  GradeLevel.NINTH,
  GradeLevel.TENTH,
  GradeLevel.ELEVENTH,
  GradeLevel.TWELFTH,
  GradeLevel.UNKNOWN,
];

const ClassRoomMealReport: React.FC<{
  classroom: Classroom;
  date: string;
}> = ({ classroom, date }) => {
  let title = "";
  if (classroom.teacher.name) {
    title = classroom.teacher.name;
  } else {
    title = classroom.teacher.firstName + " " + classroom.teacher.lastName;
  }
  title += " - " + getGradeName(classroom.grade);
  return (
    <>
      <tr>
        <td
          colSpan={2}
          style={{
            borderTop: "1px solid #333",
            padding: "8px",
            textAlign: "left",
          }}
        >
          <Typography variant="body2" fontWeight="bold">
            {title}
          </Typography>
        </td>
      </tr>

      {classroom.students.map((student) => (
        <StudentMealReport key={student.id} student={student} date={date} />
      ))}
      <StaffMealReport staffMember={classroom.teacher} date={date} />
      {/* Student rows */}
    </>
  );
};

const GradeLevelMealReport: React.FC<{
  gradeLevelStudents: GradeLevelStudents;
  date: string;
}> = ({ gradeLevelStudents, date }) => {
  return (
    <>
      <tr>
        <td
          colSpan={2}
          style={{
            borderTop: "1px solid #333",
            padding: "8px",
            textAlign: "left",
          }}
        >
          <Typography variant="body2" fontWeight="bold">
            {gradeLevelStudents.gradeLevel === GradeLevel.UNKNOWN
              ? "Students with No Lunch Time"
              : getGradeName(gradeLevelStudents.gradeLevel)}
          </Typography>
        </td>
      </tr>

      {gradeLevelStudents.students.map((student) => (
        <StudentMealReport key={student.id} student={student} date={date} />
      ))}
    </>
  );
};

const PrintableHourlyMealReport: React.FC<{
  date: string;
  time?: string;
}> = ({ date, time }) => {
  const { students, users, currentSchoolYear, orders } =
    React.useContext(AppContext);

  // Get the day of week for the current date
  const dayOfWeek = DateTimeUtils.toDate(date).getDay();

  const teachers = users
    .filter((user) => user.role === Role.TEACHER)
    .sort((a, b) => {
      // Get the grade level for each teacher from teacherLunchTimes
      const aTeacherLunchTime = currentSchoolYear.teacherLunchTimes.find(
        (tlt) => tlt.teacherId === a.id && tlt.dayOfWeek === dayOfWeek
      );

      const bTeacherLunchTime = currentSchoolYear.teacherLunchTimes.find(
        (tlt) => tlt.teacherId === b.id && tlt.dayOfWeek === dayOfWeek
      );

      // Get the primary grade level for each teacher (use first grade in the array)
      const aGradeLevel = aTeacherLunchTime?.grades?.[0];
      const bGradeLevel = bTeacherLunchTime?.grades?.[0];

      // If both have grade levels, sort by grade first
      if (aGradeLevel && bGradeLevel) {
        const aIndex = gradeOrder.indexOf(aGradeLevel);
        const bIndex = gradeOrder.indexOf(bGradeLevel);

        if (aIndex !== bIndex) {
          return aIndex - bIndex;
        }
      } else if (aGradeLevel && !bGradeLevel) {
        return -1;
      } else if (!aGradeLevel && bGradeLevel) {
        return 1;
      }
      // If grade levels are the same or undefined, sort by teacher name
      const aName = a.firstName + " " + a.lastName;
      const bName = b.firstName + " " + b.lastName;
      return aName.toLowerCase().localeCompare(bName.toLowerCase());
    });

  const meals = time
    ? getMealsAtTime(orders, teachers, students, currentSchoolYear, date, time)
    : getMealsWithIrregularTimes(
        orders,
        teachers,
        students,
        currentSchoolYear,
        date
      );

  // Use Sets to store unique staff and students
  const staffSet = new Set<User>();
  const studentSet = new Set<Student>();

  meals.forEach((meal) => {
    if (meal.staffMemberId) {
      const staffMember = users.find(
        (u) => u.id === meal.staffMemberId && u.role !== Role.TEACHER
      );
      if (staffMember) {
        staffSet.add(staffMember);
      }
    }
    if (meal.studentId) {
      const student = students.find((s) => s.id === meal.studentId);
      if (student) {
        studentSet.add(student);
      }
    }
  });

  // Convert Sets to arrays and sort
  const sortedStaff = Array.from(staffSet).sort((a, b) => {
    const aName = a.firstName + " " + a.lastName;
    const bName = b.firstName + " " + b.lastName;
    return aName.toLowerCase().localeCompare(bName.toLowerCase());
  });

  const sortedStudents = Array.from(studentSet).sort((a, b) => {
    const aName = a.firstName + " " + a.lastName;
    const bName = b.firstName + " " + b.lastName;
    return aName.toLowerCase().localeCompare(bName.toLowerCase());
  });

  // Create classrooms based on student lunch time assignments
  const classrooms: Classroom[] = teachers.map((teacher) => {
    const teacherLunchTimes = currentSchoolYear.teacherLunchTimes.filter(
      (tlt) => tlt.teacherId === teacher.id
    );
    const grade =
      teacherLunchTimes.find((tlt) => tlt.dayOfWeek === dayOfWeek)
        ?.grades?.[0] ?? GradeLevel.UNKNOWN;
    return {
      teacher,
      grade,
      students: [],
    };
  });

  // Group students by their assigned teacher at lunch time
  sortedStudents.forEach((student) => {
    const studentLunchTime = currentSchoolYear.studentLunchTimes.find(
      (slt) => slt.studentId === student.id && slt.dayOfWeek === dayOfWeek
    );

    if (studentLunchTime?.teacherId) {
      const classroom = classrooms.find(
        (c) => c.teacher.id === studentLunchTime.teacherId
      );
      if (classroom && !classroom.students.find((s) => s.id === student.id)) {
        classroom.students.push(student);
      }
    }
  });

  // Group students without assigned teachers by grade level
  const gradesNotAssignedByTeacher = gradeOrder.filter(
    (grade) => !currentSchoolYear.gradesAssignedByClass.includes(grade)
  );
  const gradeLevelStudents: GradeLevelStudents[] =
    gradesNotAssignedByTeacher.map((grade) => ({
      gradeLevel: grade,
      students: [],
    }));

  sortedStudents.forEach((student) => {
    const studentLunchTime = currentSchoolYear.studentLunchTimes.find(
      (slt) => slt.studentId === student.id && slt.dayOfWeek === dayOfWeek
    );

    if (studentLunchTime && !studentLunchTime.teacherId) {
      const cohorts = gradeLevelStudents.find(
        (c) => c.gradeLevel === studentLunchTime.grade
      );
      if (cohorts && !cohorts.students.find((s) => s.id === student.id)) {
        cohorts.students.push(student);
      }
    }
  });

  const studentsWithUnkownLunchTimes = sortedStudents.filter((student) => {
    // Check if student is in any classroom
    const isInClassroom = classrooms.some((classroom) =>
      classroom.students.some((s) => s.id === student.id)
    );

    // Check if student is in any grade level group
    const isInGradeLevel = gradeLevelStudents.some((gradeGroup) =>
      gradeGroup.students.some((s) => s.id === student.id)
    );

    // Return true if student is not in either array
    return !isInClassroom && !isInGradeLevel;
  });

  if (studentsWithUnkownLunchTimes.length > 0) {
    gradeLevelStudents.push({
      gradeLevel: GradeLevel.UNKNOWN,
      students: studentsWithUnkownLunchTimes,
    });
  }

  if (
    classrooms.length === 0 &&
    gradeLevelStudents.length === 0 &&
    sortedStaff.length === 0
  ) {
    return <></>;
  }

  const summaryText = time
    ? DateTimeUtils.toTwelveHourTime(time)
    : `Other/Unknown Times`;

  return (
    <Box sx={{ pageBreakBefore: "always" }}>
      <Box>
        <Typography variant="body1" fontWeight="bold">
          {DateTimeUtils.toString(date, DateTimeFormat.SHORT_DAY_OF_WEEK_DESC)}{" "}
          @ {summaryText}
        </Typography>
      </Box>
      <table
        style={{
          width: "100%",
          borderCollapse: "separate",
          borderSpacing: "0",
          marginTop: "10px",
          border: "1px solid #000",
        }}
      >
        <tbody>
          {classrooms
            .filter(
              (classroom) =>
                classroom.students.length > 0 ||
                meals.some(
                  (meal) => meal.staffMemberId === classroom.teacher.id
                )
            )
            .map((classroom) => (
              <ClassRoomMealReport
                key={classroom.teacher.id}
                classroom={classroom}
                date={date}
              />
            ))}
          {/* Grade level groups for students without assigned teachers */}
          {gradeLevelStudents
            .filter((gradeGroup) => gradeGroup.students.length > 0)
            .map((gradeGroup) => (
              <GradeLevelMealReport
                key={`grade-${gradeGroup.gradeLevel}`}
                gradeLevelStudents={gradeGroup}
                date={date}
              />
            ))}
          {sortedStaff.length > 0 && (
            <tr>
              <td
                colSpan={2}
                style={{
                  borderTop: "1px solid #333",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                <Typography variant="body2" fontWeight="bold">
                  Staff
                </Typography>
              </td>
            </tr>
          )}
          {sortedStaff.map((staffMember) => (
            <StaffMealReport
              key={staffMember.id}
              staffMember={staffMember}
              date={date}
            />
          ))}
        </tbody>
      </table>
    </Box>
  );
};

const MealReport: React.FC<MealReportProps> = ({ meals, title }) => {
  return (
    <>
      {meals.map((meal, mealIndex) => (
        <tr key={meal.id}>
          <td
            style={{
              borderTop: mealIndex === 0 ? "1px solid #333" : "0px",
              // borderBottom: mealIndex === meals.length - 1 ? "1px solid #333" : "0px",
              width: "250px",
              padding: "8px",
              textAlign: "left",
            }}
          >
            <Typography variant="body2">
              {mealIndex === 0 ? title : ""}
            </Typography>
          </td>
          <td
            style={{
              borderLeft: "1px solid #333",
              borderTop: "1px solid #333",
              padding: "8px",
              textAlign: "left",
            }}
          >
            <Typography variant="body2">
              {[...meal.items]
                .sort((item1, item2) => {
                  return (
                    item1.type - item2.type ||
                    item1.name
                      .toLowerCase()
                      .localeCompare(item2.name.toLowerCase())
                  );
                })
                .map((item) => item.name)
                .join(", ")}
            </Typography>
          </td>
        </tr>
      ))}
    </>
  );
};

const StaffMealReport: React.FC<StaffMealReportProps> = ({
  staffMember,
  date,
}) => {
  const { orders } = React.useContext(AppContext);
  const meals: Meal[] = orders
    .flatMap((order) => order.meals)
    .filter((m) => m.staffMemberId === staffMember.id && m.date === date);

  if (!meals.length) {
    return <></>;
  }

  const title =
    staffMember.firstName && staffMember.lastName
      ? staffMember.firstName + " " + staffMember.lastName
      : staffMember.userName;
  return <MealReport meals={meals} title={title} />;
};

const StudentMealReport: React.FC<StudentMealReportProps> = ({
  student,
  date,
}) => {
  const { orders } = React.useContext(AppContext);
  const meals: Meal[] = orders
    .flatMap((order) => order.meals)
    .filter((m) => m.studentId === student.id && m.date === date);

  if (!meals.length) {
    return <></>;
  }

  return (
    <MealReport
      meals={meals}
      title={student.firstName + " " + student.lastName}
    />
  );
};

export default PrintableHourlyMealReport;
