import * as React from "react";
import { Box, Typography } from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import { grey } from "@mui/material/colors";
import MenuItemChip from "./MenuItemChip";
import Meal from "../../models/Meal";
import Student from "../../models/Student";
import { DateTimeUtils } from "../../DateTimeUtils";

interface StudentMealReportProps {
  student: Student;
  date: string;
}

const ClassroomMealReport: React.FC<{ date: string; teacherId: number }> = ({
  date,
  teacherId,
}) => {
  const { students } = React.useContext(AppContext);

  const dayOfWeek = DateTimeUtils.toDate(date).getDay();

  const sortedStudents = students
    .filter((student) =>
      student.lunchTimes.find(
        (lt) => lt.dayOfWeek === dayOfWeek && lt.teacherId == teacherId
      )
        ? true
        : false
    )
    .sort((s1, s2) =>
      s1.name.toLowerCase().localeCompare(s2.name.toLowerCase())
    );

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        borderWidth: "1px",
        borderStyle: "solid",
      }}
    >
      {sortedStudents.map((student) => (
        <StudentMealReport key={student.id} student={student} date={date} />
      ))}
    </Box>
  );
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
    <>
      <Box
        sx={{
          borderBottomWidth: "1px",
          borderBottomColor: grey[400],
          borderBottomStyle: "solid",
          borderRightWidth: "1px",
          borderRightColor: grey[400],
          borderRightStyle: "solid",
          p: 1,
          gridRowEnd: meals.length > 1 ? "span " + meals.length : undefined,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Typography variant="body2">{student.name}</Typography>
      </Box>
      {meals.map((meal) => (
        <Box
          key={meal.id}
          sx={{
            borderBottomWidth: "1px",
            borderBottomColor: grey[400],
            borderBottomStyle: "solid",
            p: 1,
            display: "flex",
            flexWrap: "wrap",
            flexDirection: "row",
            gap: 1,
          }}
        >
          {[...meal.items]
            .sort((item1, item2) => {
              return (
                item1.type - item2.type ||
                item1.name.toLowerCase().localeCompare(item2.name.toLowerCase())
              );
            })
            .map((item) => (
              <MenuItemChip key={item.id} menuItem={item} />
            ))}
        </Box>
      ))}
    </>
  );
};

export default ClassroomMealReport;
