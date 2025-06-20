import React, { useContext, useState } from "react";
import { Stack, Typography, IconButton, Box } from "@mui/material";
import { getGradeName, GradeLevel } from "../../models/GradeLevel";
import { DayOfWeek } from "../../models/DayOfWeek";
import Student from "../../models/Student";
import { AppContext } from "../../AppContextProvider";
import { Role } from "../../models/User";
import { Edit } from "@mui/icons-material";
import StudentLunchtimeDialog from "./StudentLunchtimeDialog";

interface Props {
  student?: Student;
  dayOfWeek: DayOfWeek;
}

const StudentLunchtimePanel: React.FC<Props> = ({ student, dayOfWeek }) => {
  const { currentSchoolYear } = useContext(AppContext);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { users } = useContext(AppContext);
  const teachers = users.filter((user) => user.role === Role.TEACHER);

  const studentLunchTime = student
    ? currentSchoolYear.studentLunchTimes.find(
        (lt) => lt.studentId === student.id && lt.dayOfWeek === dayOfWeek
      )
    : undefined;

  const gradeLevel =
    currentSchoolYear.studentLunchTimes.find(
      (lt) => lt.studentId === student?.id
    )?.grade ?? GradeLevel.UNKNOWN;
  const gradeDisplayName = getGradeName(gradeLevel);

  let teacherDisplayName = "Not Needed";

  if (gradeLevel === GradeLevel.UNKNOWN) {
    teacherDisplayName = "Unknown";
  } else if (currentSchoolYear.gradesAssignedByClass.includes(gradeLevel)) {
    const teacher = studentLunchTime?.teacherId
      ? teachers.find((t) => t.id === studentLunchTime.teacherId)
      : undefined;
    teacherDisplayName = teacher?.name ?? "Unknown";
  }

  const handleCloseDialog = () => {
    setShowEditDialog(false);
  };

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        gap={1}
        flexWrap="wrap"
      >
        <Typography fontWeight="bold" variant="body2">
          Lunchtime Info.
        </Typography>
        <IconButton
          size="small"
          color="primary"
          disabled={!student}
          onClick={() => setShowEditDialog(true)}
        >
          <Edit />
        </IconButton>
      </Stack>

      <Box
        sx={{
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            m: 1,
            display: "inline-grid",
            gridTemplateColumns: "auto auto",
            gap: 1,
          }}
        >
          <Typography fontWeight="bold" variant="body2">
            Grade:
          </Typography>
          <Typography variant="body2">{gradeDisplayName}</Typography>
          <Typography fontWeight="bold" variant="body2">
            Teacher:
          </Typography>
          <Typography variant="body2">{teacherDisplayName}</Typography>
        </Box>
      </Box>
      {showEditDialog && student && (
        <StudentLunchtimeDialog student={student} onClose={handleCloseDialog} />
      )}
    </Box>
  );
};

export default StudentLunchtimePanel;
