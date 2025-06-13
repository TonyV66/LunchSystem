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
  Box,
  Tooltip,
  Stack,
  Chip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SchoolYear from "../../models/SchoolYear";
import { AppContext } from "../../AppContextProvider";
import { DayOfWeek } from "../../models/DayOfWeek";
import TeacherLunchTimesDialog from "./TeacherLunchTimesDialog";
import { Role } from "../../models/User";
import { DateTimeUtils } from "../../DateTimeUtils";

interface TeacherLunchTimesTableProps {
  schoolYear: SchoolYear;
}

const TeacherLunchTimesTable: React.FC<TeacherLunchTimesTableProps> = ({
  schoolYear,
}) => {
  const { users } = useContext(AppContext);
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);

  const teachers = users.filter((user) => user.role === Role.TEACHER);

  const getLunchTimes = (teacherId: number, dayOfWeek: DayOfWeek): string[] => {
    const lunchTime = schoolYear.teacherLunchTimes.find(
      (lt) =>
        lt.teacherId === teacherId &&
        lt.dayOfWeek === dayOfWeek
    );
    return (
      lunchTime?.times.map((time) => DateTimeUtils.toTwelveHourTime(time)) ?? []
    );
  };

  const handleEditClick = (teacherId: number) => {
    setSelectedTeacher(teacherId);
  };

  const handleDialogClose = () => {
    setSelectedTeacher(null);
  };

  return (
    <Box>
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
                  {teacher.name}
                </TableCell>
                <TableCell
                  sx={{ borderRight: 1, borderColor: "divider", width: "17%" }}
                >
                  <Stack direction="row" gap={1} flexWrap="wrap">
                    {getLunchTimes(teacher.id, DayOfWeek.MONDAY).map((lt) => (
                      <Chip
                        key={DayOfWeek.MONDAY.toString() + ":" + lt.toString()}
                        variant="outlined"
                        size="small"
                        label={lt}
                      />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell
                  sx={{ borderRight: 1, borderColor: "divider", width: "17%" }}
                >
                  <Stack direction="row" gap={1} flexWrap="wrap">
                    {getLunchTimes(teacher.id, DayOfWeek.TUESDAY).map((lt) => (
                      <Chip
                        key={DayOfWeek.TUESDAY.toString() + ":" + lt.toString()}
                        variant="outlined"
                        size="small"
                        label={lt}
                      />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell
                  sx={{ borderRight: 1, borderColor: "divider", width: "17%" }}
                >
                  <Stack direction="row" gap={1} flexWrap="wrap">
                    {getLunchTimes(teacher.id, DayOfWeek.WEDNESDAY).map((lt) => (
                      <Chip
                        key={DayOfWeek.WEDNESDAY.toString() + ":" + lt.toString()}
                        variant="outlined"
                        size="small"
                        label={lt}
                      />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell
                  sx={{ borderRight: 1, borderColor: "divider", width: "17%" }}
                >
                  <Stack direction="row" gap={1} flexWrap="wrap">
                    {getLunchTimes(teacher.id, DayOfWeek.THURSDAY).map((lt) => (
                      <Chip
                        key={DayOfWeek.THURSDAY.toString() + ":" + lt.toString()}
                        variant="outlined"
                        size="small"
                        label={lt}
                      />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell
                  sx={{ borderRight: 1, borderColor: "divider", width: "17%" }}
                >
                  <Stack direction="row" gap={1} flexWrap="wrap">
                    {getLunchTimes(teacher.id, DayOfWeek.FRIDAY).map((lt) => (
                      <Chip
                        key={DayOfWeek.FRIDAY.toString() + ":" + lt.toString()}
                        variant="outlined"
                        size="small"
                        label={lt}
                      />
                    ))}
                  </Stack>
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
    </Box>
  );
};

export default TeacherLunchTimesTable;
