import React, { useContext, useState } from "react";
import {
  IconButton,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  Menu as PulldownMenu,
  DialogActions,
  Button,
  Typography,
  Chip,
  MenuItem,
} from "@mui/material";
import { MoreVert } from "@mui/icons-material";
import { grey, orange } from "@mui/material/colors";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridValidRowModel,
} from "@mui/x-data-grid";
import { AppContext } from "../../AppContextProvider";
import { getGradeName } from "../../models/GradeLevel";
import User from "../../models/User";
import Student from "../../models/Student";
import StudentMealsDialog from "../meals/StudentMealsDialog";
import EditStudentDialog from "./EditStudentDialog";

interface StudentMenuProps {
    anchor: HTMLElement;
    onEdit: () => void;
    onShowMeals: () => void;
    onClose: () => void;
  }
  
const StudentMenu: React.FC<StudentMenuProps> = ({
    anchor,
    onEdit,
    onShowMeals,
    onClose,
  }) => {
    const { currentSchoolYear } = useContext(AppContext);
    
    return (
      <PulldownMenu
        id="demo-positioned-menu"
        aria-labelledby="demo-positioned-button"
        anchorEl={anchor}
        open={true}
        onClose={onClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        <MenuItem onClick={onEdit}>Edit</MenuItem>
        <MenuItem onClick={onShowMeals} disabled={!currentSchoolYear.id}>Upcoming Meals</MenuItem>
      </PulldownMenu>
    );
  };
  
interface Row {
  id: number;
  name: string;
  birthDate: string;
  grade: string;
  parents: {
    name: string;
    count: number;
    parents: User[];
    onShowAll: () => void;
  };
  teacher: {
    name: string;
    count: number;
    hasIncompleteAssignment: boolean;
    onShowAll: () => void;
  };
  onShowMenu: (studentId: number, menuAnchor: HTMLElement) => void;
}

interface TeacherAssignment {
  dayOfWeek: number;
  dayName: string;
  teacher?: User;
}

const parentsCellRenderer = (
  params: GridRenderCellParams<
    GridValidRowModel,
    { name: string; count: number; parents: User[]; onShowAll: () => void }
  >
) => {
  const { name, count, onShowAll } = params.value!;

  if (count <= 1) {
    return <span>{name}</span>;
  }

  return (
    <Link
      component="button"
      variant="body2"
      onClick={onShowAll}
      sx={{ textDecoration: "underline", cursor: "pointer" }}
    >
      {name + " +" + (count - 1)}
    </Link>
  );
};

const teacherCellRenderer = (
  params: GridRenderCellParams<
    GridValidRowModel,
    {
      name: string;
      count: number;
      hasIncompleteAssignment: boolean;
      onShowAll: () => void;
    }
  >
) => {
  const { name, count, hasIncompleteAssignment, onShowAll } = params.value!;

  if (count <= 1) {
    return (
      <span
        style={{ color: hasIncompleteAssignment ? orange[600] : "inherit" }}
      >
        {name}
      </span>
    );
  }

  return (
    <Link
      component="button"
      variant="body2"
      onClick={onShowAll}
      sx={{
        textDecoration: "underline",
        cursor: "pointer",
        color: hasIncompleteAssignment ? orange[600] : undefined,
      }}
    >
      {name + " +" + (count - 1)}
    </Link>
  );
};

const columns: GridColDef[] = [
  { field: "name", headerName: "Student Name", flex: 1 },
  { field: "grade", headerName: "Grade", width: 100 },
  {
    field: "teacher",
    headerName: "Teacher(s)",
    flex: 1,
    renderCell: teacherCellRenderer,
  },
  {
    field: "parents",
    headerName: "Parents & Guardians",
    flex: 1,
    renderCell: parentsCellRenderer,
  },
  { field: "birthDate", headerName: "Birth Date", width: 120 },
  {
    field: "onShowMenu",
    headerName: "Actions",
    width: 80,
    renderCell: (
      params: GridRenderCellParams<
        GridValidRowModel,
        (studentId: number, menuAnchor: null | HTMLElement) => void
      >
    ) => (
      <IconButton
        color="primary"
        onClick={(event) =>
          params.value!(params.id as number, event.currentTarget)
        }
        size="small"
      >
        <MoreVert />
      </IconButton>
    ),
  },
];

interface StudentsTableProps {
  user?: User;
}

type MenuAction = "edit" | "meals";

const StudentsTable: React.FC<StudentsTableProps> = ({ user }) => {
  const {
    currentSchoolYear,
    users,
    user: loggedInUser,
    students,
  } = React.useContext(AppContext);
  const [selectedParents, setSelectedParents] = React.useState<User[]>([]);
  const [showParentsDialog, setShowParentsDialog] = React.useState(false);
  const [selectedTeacherAssignments, setSelectedTeacherAssignments] =
    React.useState<TeacherAssignment[]>([]);
  const [showTeachersDialog, setShowTeachersDialog] = React.useState(false);
  const [pulldownMenuAnchor, setPulldownMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [targetStudent, setTargetStudent] = useState<null | Student>(null);
  const [action, setAction] = useState<null | MenuAction>(null);

  const handleShowPopupMenu = (
    studentId: number,
    menuAnchor: null | HTMLElement
  ) => {
    setTargetStudent(students.find((student) => student.id === studentId)!);
    setPulldownMenuAnchor(menuAnchor);
  };

  const handleShowAllParents = (parents: User[]) => {
    setSelectedParents(parents);
    setShowParentsDialog(true);
  };

  const handleCloseParentsDialog = () => {
    setShowParentsDialog(false);
    setSelectedParents([]);
  };

  const handleShowAllTeachers = (assignments: TeacherAssignment[]) => {
    setSelectedTeacherAssignments(assignments);
    setShowTeachersDialog(true);
  };

  const handleCloseTeachersDialog = () => {
    setShowTeachersDialog(false);
    setSelectedTeacherAssignments([]);
  };

  const handleActionComplete = () => {
    setTargetStudent(null);
    setAction(null);
  };

  const handleCloseStudentDialog = () => {
    setAction(null);
  };

  const handleEditStudent = () => {
    setAction("edit");
    setPulldownMenuAnchor(null);
  };

  const handleShowMeals = () => {
    setAction("meals");
    setPulldownMenuAnchor(null);
  };

  const handleCloseMenu = () => {
    setTargetStudent(null);
    setPulldownMenuAnchor(null);
  };

  const getDayName = (dayOfWeek: number): string => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[dayOfWeek];
  };

  const rows: Row[] = students
    .filter(
      (student) => user === undefined || student.parents.includes(user.id)
    )
    .map((student) => {
      // Find the student's Monday lunch time assignment to get their grade level
      const mondayLunchTime = currentSchoolYear.studentLunchTimes.find(
        (lt) => lt.studentId === student.id && lt.dayOfWeek === 1 // Monday = 1
      );

      const grade = mondayLunchTime ? getGradeName(mondayLunchTime.grade) : "";

      // Get all parents for this student
      const studentParents: User[] = [];
      if (student.parents && student.parents.length > 0) {
        if (student.id === 21) {
          console.log(student.parents);
        }
        student.parents.forEach((parentId) => {
          const parent = users.find((u) => u.id === parentId);
          if (parent) {
            studentParents.push(parent);
          }
        });
      }

      // Sort parents by name
      const sortedParents = studentParents.sort((a, b) => {
        const nameA = `${a.firstName} ${a.lastName}`;
        const nameB = `${b.firstName} ${b.lastName}`;
        return nameA.localeCompare(nameB);
      });

      // Determine which parent name to show
      let parentName = "";
      if (sortedParents.length > 0) {
        // Check if current user is a parent/guardian of this student
        const isCurrentUserParent = student.parents.includes(loggedInUser.id);

        if (isCurrentUserParent) {
          // Show current user's name
          parentName = `${loggedInUser.firstName} ${loggedInUser.lastName}`;
        } else {
          // Show first parent's name
          parentName = `${sortedParents[0].firstName} ${sortedParents[0].lastName}`;
        }
      }

      // Get all teacher assignments for this student
      const teacherAssignments: TeacherAssignment[] = [];
      const assignedDays = new Set<number>();

      // Create assignments for weekdays only (Monday = 1 through Friday = 5)
      for (let day = 1; day <= 5; day++) {
        const lunchTime = currentSchoolYear.studentLunchTimes.find(
          (lt) =>
            lt.studentId === student.id && lt.dayOfWeek === day && lt.teacherId
        );

        if (lunchTime) {
          const teacher = users.find((u) => u.id === lunchTime.teacherId);
          if (teacher) {
            teacherAssignments.push({
              dayOfWeek: day,
              dayName: getDayName(day),
              teacher: teacher,
            });
            assignedDays.add(day);
          }
        } else {
          teacherAssignments.push({
            dayOfWeek: day,
            dayName: getDayName(day),
          });
        }
      }

      // Check if there are any teacher assignments but not for all weekdays
      const hasIncompleteAssignment =
        assignedDays.size > 0 && assignedDays.size < 5;

      // Get unique teachers
      const uniqueTeachers = teacherAssignments
        .filter((assignment) => assignment.teacher)
        .map((assignment) => assignment.teacher!)
        .filter(
          (teacher, index, self) =>
            index === self.findIndex((t) => t.id === teacher.id)
        );

      // Determine which teacher name to show
      let teacherName = "";
      if (uniqueTeachers.length > 0) {
        // Get current day of week (0 = Sunday, 1 = Monday, etc.)
        const today = new Date();
        const currentDayOfWeek = today.getDay();

        // If it's a weekday and there's a teacher assigned for today, show that teacher
        if (currentDayOfWeek >= 1 && currentDayOfWeek <= 5) {
          const todayAssignment = teacherAssignments.find(
            (assignment) => assignment.dayOfWeek === currentDayOfWeek
          );
          if (todayAssignment?.teacher) {
            teacherName = todayAssignment.teacher.name.length
              ? todayAssignment.teacher.name
              : `${todayAssignment.teacher.firstName} ${todayAssignment.teacher.lastName}`;
          }
        }

        // Fallback to first teacher alphabetically if no current day assignment
        if (!teacherName) {
          const sortedTeachers = uniqueTeachers.sort((a, b) => {
            const nameA = a.name.length
              ? a.name
              : `${a.firstName} ${a.lastName}`;
            const nameB = b.name.length
              ? b.name
              : `${b.firstName} ${b.lastName}`;
            return nameA.localeCompare(nameB);
          });
          teacherName = sortedTeachers[0].name.length
            ? sortedTeachers[0].name
            : `${sortedTeachers[0].firstName} ${sortedTeachers[0].lastName}`;
        }
      }

      return {
        id: student.id,
        name: student.firstName + " " + student.lastName,
        birthDate: student.birthDate,
        grade: grade,
        parents: {
          name: parentName,
          count: sortedParents.length,
          parents: sortedParents,
          onShowAll: () => handleShowAllParents(sortedParents),
        },
        teacher: {
          name: teacherName,
          count: uniqueTeachers.length,
          hasIncompleteAssignment: hasIncompleteAssignment,
          onShowAll: () => handleShowAllTeachers(teacherAssignments),
        },
        onShowMenu: handleShowPopupMenu,
      };
    });

  return (
    <>
      <DataGrid
        sx={{
          mb: 2,
          borderColor: grey[400],
          backgroundColor: "white",
        }}
        density="compact"
        rows={rows}
        disableRowSelectionOnClick
        columns={columns}
      />

      <Dialog
        open={showParentsDialog}
        onClose={handleCloseParentsDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>All Parents & Guardians</DialogTitle>
        <DialogContent>
          <List dense>
            {selectedParents.map((parent) => (
              <ListItem key={parent.id}>
                <Typography variant="body2">
                  {parent.firstName} {parent.lastName}
                </Typography>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseParentsDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showTeachersDialog}
        onClose={handleCloseTeachersDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Teacher Assignments by Day</DialogTitle>
        <DialogContent>
          <List dense>
            {selectedTeacherAssignments.map((assignment) => (
              <ListItem key={assignment.dayOfWeek}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: "bold", minWidth: "100px" }}
                  >
                    {assignment.dayName}:
                  </Typography>
                  {assignment.teacher ? (
                    <Typography variant="body2">
                      {assignment.teacher.name.length
                        ? assignment.teacher.name
                        : `${assignment.teacher.firstName} ${assignment.teacher.lastName}`}
                    </Typography>
                  ) : (
                    <Chip
                      label="No Teacher Assigned"
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  )}
                </div>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTeachersDialog}>Close</Button>
        </DialogActions>
      </Dialog>
      {targetStudent && pulldownMenuAnchor ? (
        <StudentMenu
          anchor={pulldownMenuAnchor!}
          onEdit={handleEditStudent}
          onShowMeals={handleShowMeals}
          onClose={handleCloseMenu}
        />
      ) : (
        <></>
      )}
      {action === "edit" ? (
        <EditStudentDialog
          student={targetStudent!}
          onClose={handleCloseStudentDialog}
        />
      ) : (
        <></>
      )}
      {action === "meals" && targetStudent ? (
        <StudentMealsDialog
          student={targetStudent}
          onClose={handleActionComplete}
        />
      ) : (
        <></>
      )}
    </>
  );
};

export default StudentsTable;
