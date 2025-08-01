import React, { useContext, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Stack,
  Typography,
  Switch,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SchoolYear from "../../models/SchoolYear";
import { AppContext } from "../../AppContextProvider";
import { DayOfWeek } from "../../models/DayOfWeek";
import TeacherLunchTimesDialog from "./TeacherLunchTimesDialog";
import { Role } from "../../models/User";
import { DateTimeUtils } from "../../DateTimeUtils";
import { updateSchoolYearTeacherConfig } from "../../api/CafeteriaClient";
import { getGradeName } from "../../models/GradeLevel";

interface TeacherLunchTimesTableProps {
  schoolYear: SchoolYear;
}

const TeacherLunchTimesTable: React.FC<TeacherLunchTimesTableProps> = ({
  schoolYear,
}) => {
  const {
    users,
    setSnackbarErrorMsg,
    schoolYears,
    setSchoolYears,
    currentSchoolYear,
    setCurrentSchoolYear,
  } = useContext(AppContext);
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  const [oneTeacherPerStudent, setOneTeacherPerStudent] = useState(
    schoolYear.oneTeacherPerStudent
  );

  const teachers = users.filter((user) => user.role === Role.TEACHER);

  const getLunchTime = (teacherId: number, dayOfWeek: DayOfWeek): string => {
    const lunchTime = schoolYear.teacherLunchTimes.find(
      (lt) => lt.teacherId === teacherId && lt.dayOfWeek === dayOfWeek
    );
    return lunchTime?.times[0]
      ? DateTimeUtils.toTwelveHourTime(lunchTime.times[0])
      : "";
  };

  const getLunchTimeGrades = (
    teacherId: number,
    dayOfWeek: DayOfWeek
  ): string => {
    const lunchTime = schoolYear.teacherLunchTimes.find(
      (lt) => lt.teacherId === teacherId && lt.dayOfWeek === dayOfWeek
    );
    return lunchTime?.grades
      ? lunchTime.grades.map((grade) => getGradeName(grade)).join(", ")
      : "";
  };

  const handleEditClick = (teacherId: number) => {
    setSelectedTeacher(teacherId);
  };

  const handleDialogClose = () => {
    setSelectedTeacher(null);
  };

  const handleOneTeacherPerStudent = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = event.target.checked;
    setOneTeacherPerStudent(newValue);

    try {
      await updateSchoolYearTeacherConfig(schoolYear.id, newValue);

      const updatedSchoolYear = {
        ...schoolYears.find((year) => year.id === schoolYear.id)!,
        oneTeacherPerStudent: newValue,
      };

      // Update the school year in the context
      setSchoolYears(
        schoolYears.map((year) =>
          year.id === updatedSchoolYear.id ? updatedSchoolYear : year
        )
      );

      // Update current school year if it's the one being modified
      if (currentSchoolYear.id === updatedSchoolYear.id) {
        setCurrentSchoolYear(updatedSchoolYear);
      }
    } catch (error) {
      // Revert the local state if the API call fails
      setOneTeacherPerStudent(!newValue);
      console.error("Failed to update setting:", error);
      setSnackbarErrorMsg("Failed to update teacher configuration");
    }
  };

  return (
    <Stack gap={2}>
      <Stack direction="row" gap={2} alignItems="center">
        <Typography variant="body2" fontWeight="bold">
          Students have the same lunchtime teacher each day:
        </Typography>
        <Stack direction="row" alignItems="center">
          <Typography
            variant="body2"
            fontWeight={!oneTeacherPerStudent ? "bold" : "normal"}
          >
            No
          </Typography>
          <Switch
            checked={oneTeacherPerStudent}
            onChange={handleOneTeacherPerStudent}
            color="primary"
          />
          <Typography
            variant="body2"
            fontWeight={oneTeacherPerStudent ? "bold" : "normal"}
          >
            Yes
          </Typography>
        </Stack>
      </Stack>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  borderRight: 1,
                  borderColor: "divider",
                  width: "15%",
                  fontWeight: "bold",
                }}
              ></TableCell>
              <TableCell
                sx={{
                  borderRight: 1,
                  borderColor: "divider",
                  width: "17%",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                Monday
              </TableCell>
              <TableCell
                sx={{
                  borderRight: 1,
                  borderColor: "divider",
                  width: "17%",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                Tuesday
              </TableCell>
              <TableCell
                sx={{
                  borderRight: 1,
                  borderColor: "divider",
                  width: "17%",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                Wednesday
              </TableCell>
              <TableCell
                sx={{
                  borderRight: 1,
                  borderColor: "divider",
                  width: "17%",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                Thursday
              </TableCell>
              <TableCell
                sx={{
                  borderRight: 1,
                  borderColor: "divider",
                  width: "17%",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                Friday
              </TableCell>
              <TableCell sx={{ width: "5%", fontWeight: "bold" }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teachers.map((teacher) => (
              <TableRow key={teacher.id}>
                <TableCell
                  sx={{
                    borderRight: 1,
                    borderColor: "divider",
                    width: "15%",
                    fontWeight: "bold",
                  }}
                >
                  {teacher.name || teacher.firstName + " " + teacher.lastName}
                </TableCell>
                <TableCell
                  sx={{
                    borderRight: 1,
                    borderColor: "divider",
                    width: "17%",
                    textAlign: "center",
                  }}
                >
                  <Typography variant="body2">
                    {getLunchTime(teacher.id, DayOfWeek.MONDAY)}
                  </Typography>
                  <Typography variant="body2">
                    {getLunchTimeGrades(teacher.id, DayOfWeek.MONDAY)}
                  </Typography>
                </TableCell>
                <TableCell
                  sx={{ borderRight: 1, borderColor: "divider", width: "17%", textAlign: "center" }}
                >
                  <Typography variant="body2">
                    {getLunchTime(teacher.id, DayOfWeek.TUESDAY)}
                  </Typography>
                  <Typography variant="body2">
                    {getLunchTimeGrades(teacher.id, DayOfWeek.TUESDAY)}
                  </Typography>
                </TableCell>
                <TableCell
                  sx={{ borderRight: 1, borderColor: "divider", width: "17%", textAlign: "center" }}
                >
                  <Typography variant="body2">
                    {getLunchTime(teacher.id, DayOfWeek.WEDNESDAY)}
                  </Typography>
                  <Typography variant="body2">
                    {getLunchTimeGrades(teacher.id, DayOfWeek.WEDNESDAY)}
                  </Typography>
                </TableCell>
                <TableCell
                  sx={{ borderRight: 1, borderColor: "divider", width: "17%", textAlign: "center" }}
                >
                  <Typography variant="body2">
                    {getLunchTime(teacher.id, DayOfWeek.THURSDAY)}
                  </Typography>
                  <Typography variant="body2">
                    {getLunchTimeGrades(teacher.id, DayOfWeek.THURSDAY)}
                  </Typography>
                </TableCell>
                <TableCell
                  sx={{ borderRight: 1, borderColor: "divider", width: "17%", textAlign: "center" }}
                >
                  <Typography variant="body2">
                    {getLunchTime(teacher.id, DayOfWeek.FRIDAY)}
                  </Typography>
                  <Typography variant="body2">
                    {getLunchTimeGrades(teacher.id, DayOfWeek.FRIDAY)}
                  </Typography>
                </TableCell>
                <TableCell sx={{ width: "5%" }}>
                  <Tooltip title="Edit lunch times">
                    <IconButton
                      onClick={() => handleEditClick(teacher.id)}
                      color="primary"
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedTeacher && (
        <TeacherLunchTimesDialog
          schoolYear={schoolYear}
          teacher={teachers.find((t) => t.id === selectedTeacher)!}
          onClose={handleDialogClose}
        />
      )}
    </Stack>
  );
};

export default TeacherLunchTimesTable;
