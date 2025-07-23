import React, { useState } from "react";
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
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SchoolYear from "../../models/SchoolYear";
import { getGradeName, GradeLevel } from "../../models/GradeLevel";
import { DayOfWeek } from "../../models/DayOfWeek";
import GradeLevelLunchTimesDialog from "./GradeLevelLunchTimesDialog";
import { DateTimeUtils } from "../../DateTimeUtils";

interface GradeLevelLunchTimesTableProps {
  schoolYear: SchoolYear;
}

const GradeLevelLunchTimesTable: React.FC<GradeLevelLunchTimesTableProps> = ({
  schoolYear,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | null>(null);

  const isGradeByClassroom = (grade: GradeLevel): boolean => {
    return schoolYear.gradesAssignedByClass.includes(grade);
  };


  const getLunchTimes = (grade: GradeLevel, dayOfWeek: DayOfWeek): string[] => {
    const lunchTime = schoolYear.gradeLunchTimes.find(
      (lt) =>
        lt.grade === grade &&
        lt.dayOfWeek === dayOfWeek
    );
    return (
      lunchTime?.times.map((time) => DateTimeUtils.toTwelveHourTime(time)) ?? []
    );
  };

  const handleEditClick = (grade: GradeLevel) => {
    setSelectedGrade(grade);
  };

  const handleDialogClose = () => {
    setSelectedGrade(null);
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
                  width: "7%",
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
            {Object.values(GradeLevel)
              .filter((grade) => grade !== GradeLevel.UNKNOWN)
              .map((grade) => {
                const byClassroom = isGradeByClassroom(grade);
                return (
                  <TableRow key={grade}>
                    <TableCell
                      sx={{
                        borderRight: 1,
                        borderColor: "divider",
                        width: "7%",
                        fontWeight: "bold",
                      }}
                    >
                      {getGradeName(grade)}
                    </TableCell>
                    {byClassroom ? (
                      <TableCell
                        colSpan={5}
                        sx={{
                          borderRight: 1,
                          borderColor: "divider",
                          backgroundColor: "action.hover",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Lunchtimes assigned by teacher
                        </Typography>
                      </TableCell>
                    ) : (
                      <>
                        <TableCell
                          sx={{
                            borderRight: 1,
                            borderColor: "divider",
                            width: "17%",
                          }}
                        >
                          <Stack direction="row" gap={1} flexWrap="wrap">
                            {getLunchTimes(grade, DayOfWeek.MONDAY).map((lt) => (
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
                          sx={{
                            borderRight: 1,
                            borderColor: "divider",
                            width: "17%",
                          }}
                        >
                          <Stack direction="row" gap={1} flexWrap="wrap">
                            {getLunchTimes(grade, DayOfWeek.TUESDAY).map((lt) => (
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
                          sx={{
                            borderRight: 1,
                            borderColor: "divider",
                            width: "17%",
                          }}
                        >
                          <Stack direction="row" gap={1} flexWrap="wrap">
                            {getLunchTimes(grade, DayOfWeek.WEDNESDAY).map((lt) => (
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
                          sx={{
                            borderRight: 1,
                            borderColor: "divider",
                            width: "17%",
                          }}
                        >
                          <Stack direction="row" gap={1} flexWrap="wrap">
                            {getLunchTimes(grade, DayOfWeek.THURSDAY).map((lt) => (
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
                          sx={{
                            borderRight: 1,
                            borderColor: "divider",
                            width: "17%",
                          }}
                        >
                          <Stack direction="row" gap={1} flexWrap="wrap">
                            {getLunchTimes(grade, DayOfWeek.FRIDAY).map((lt) => (
                              <Chip
                                key={DayOfWeek.FRIDAY.toString() + ":" + lt.toString()}
                                variant="outlined"
                                size="small"
                                label={lt}
                              />
                            ))}
                          </Stack>
                        </TableCell>
                      </>
                    )}
                    <TableCell sx={{ width: "5%" }}>
                      {!byClassroom && (
                        <Tooltip title="Edit lunch times">
                          <IconButton
                            onClick={() => handleEditClick(grade)}
                            color="primary"
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedGrade && (
        <GradeLevelLunchTimesDialog
          schoolYear={schoolYear}
          grade={selectedGrade}
          onClose={handleDialogClose}
        />
      )}
    </Box>
  );
};

export default GradeLevelLunchTimesTable;
