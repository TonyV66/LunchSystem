import React from "react";
import { IconButton } from "@mui/material";
import { MoreVert } from "@mui/icons-material";
import { grey } from "@mui/material/colors";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridValidRowModel,
} from "@mui/x-data-grid";
import Student from "../../models/Student";
import { AppContext } from "../../AppContextProvider";
import { getGradeName } from "../../models/GradeLevel";

interface Row {
  id: number;
  name: string;
  birthDate: string;
  grade: string;
  parents: string;
  teacher: string;
  onShowMenu: (studentId: number, menuAnchor: HTMLElement) => void;
}

const columns: GridColDef[] = [
  { field: "name", headerName: "Student Name", flex: 1 },
  { field: "grade", headerName: "Grade", width: 100 },
  { field: "teacher", headerName: "Teacher(s)", flex: 1 },
  { field: "parents", headerName: "Parents & Guardians", flex: 1 },
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
  students: Student[];
  onShowMenu: (studentId: number, menuAnchor: null | HTMLElement) => void;
}

const StudentsTable: React.FC<StudentsTableProps> = ({ students, onShowMenu }) => {
  const { currentSchoolYear, users, user } = React.useContext(AppContext);
  
  const rows: Row[] = students.map((student) => {
    // Find the student's Monday lunch time assignment to get their grade level
    const mondayLunchTime = currentSchoolYear.studentLunchTimes.find(
      (lt) => lt.studentId === student.id && lt.dayOfWeek === 1 // Monday = 1
    );
    
    const grade = mondayLunchTime ? getGradeName(mondayLunchTime.grade) : "";
    
    // Determine which parent name to show
    let parentName = "";
    if (student.parents && student.parents.length > 0) {
      // Check if current user is a parent/guardian of this student
      const isCurrentUserParent = student.parents.includes(user.id);
      
      if (isCurrentUserParent) {
        // Show current user's name
        parentName = `${user.firstName} ${user.lastName}`;
      } else {
        // Show first parent's name
        const firstParentId = student.parents[0];
        const firstParent = users.find(u => u.id === firstParentId);
        if (firstParent) {
          parentName = `${firstParent.firstName} ${firstParent.lastName}`;
        }
      }
    }
    
    // Find teacher assigned to the earliest day of the week
    let teacherName = "";
    const studentLunchTimes = currentSchoolYear.studentLunchTimes.filter(
      (lt) => lt.studentId === student.id && lt.teacherId
    );
    
    if (studentLunchTimes.length > 0) {
      // Sort by day of week (0 = Sunday, 1 = Monday, etc.) and get the earliest
      const earliestLunchTime = studentLunchTimes.sort((a, b) => a.dayOfWeek - b.dayOfWeek)[0];
      const teacher = users.find(u => u.id === earliestLunchTime.teacherId);
      if (teacher) {
        teacherName = `${teacher.firstName} ${teacher.lastName}`;
      }
    }
    
    return {
      id: student.id,
      name: student.firstName + " " + student.lastName,
      birthDate: student.birthDate,
      grade: grade,
      parents: parentName,
      teacher: teacherName,
      onShowMenu: onShowMenu,
    };
  });

  return (
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
  );
};

export default StudentsTable; 