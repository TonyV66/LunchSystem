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
import User, { Role, ROLE_NAMES } from "../../models/User";
import { AppContext } from "../../AppContextProvider";

interface Row {
  id: number;
  username: string;
  name: string;
  email: string;
  students: string;
  role: Role;
  onShowMenu: undefined | ((userId: number, menuAnchor: HTMLElement) => void);
}

const roleCellRenderer = (
  params: GridRenderCellParams<GridValidRowModel, Role>
) => ROLE_NAMES[params.row.role];

const actionCellRenderer = (
  params: GridRenderCellParams<
    GridValidRowModel,
    (userId: number, menuAnchor: null | HTMLElement) => void
  >
) => {
  console.log(params);
  return (
    <IconButton
      color="primary"
      disabled={!params.value}
      onClick={(event) =>
        params.value!(params.id as number, event.currentTarget)
      }
      size="small"
    >
      <MoreVert />
    </IconButton>
  );
};

const columns: GridColDef[] = [
  { field: "username", headerName: "Username", minWidth: 150 },
  { field: "name", headerName: "Name", minWidth: 200 },
  { field: "email", headerName: "Email", minWidth: 250 },
  { field: "students", headerName: "Student(s)", minWidth: 200 },
  { field: "role", headerName: "Role", flex: 1, renderCell: roleCellRenderer },
  {
    field: "onShowMenu",
    headerName: "Actions",
    width: 80,
    renderCell: actionCellRenderer,
  },
];

interface UsersTableProps {
  users: User[];
  currentUser: User;
  onShowMenu: (userId: number, menuAnchor: null | HTMLElement) => void;
}

const UsersTable: React.FC<UsersTableProps> = ({ users, currentUser, onShowMenu }) => {
  const { students, orders } = React.useContext(AppContext);
  
  const rows: Row[] = users.map((usr) => {
    // Find students that belong to this user
    const userStudents = students.filter(student => 
      student.parents && student.parents.includes(usr.id)
    );
    
    // Sort students by name
    const sortedStudents = userStudents.sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`;
      const nameB = `${b.firstName} ${b.lastName}`;
      return nameA.localeCompare(nameB);
    });
    
    let studentName = "";
    if (sortedStudents.length > 0) {
      // Find the first student with an ordered meal
      const studentWithOrder = sortedStudents.find(student => {
        return orders.some(order => 
          order.meals.some(meal => meal.studentId === student.id)
        );
      });
      
      if (studentWithOrder) {
        studentName = `${studentWithOrder.firstName} ${studentWithOrder.lastName}`;
      } else {
        // If no student has an ordered meal, show the first student
        const firstStudent = sortedStudents[0];
        studentName = `${firstStudent.firstName} ${firstStudent.lastName}`;
      }
    }
    
    return {
      id: usr.id,
      username: usr.userName,
      name: `${usr.firstName} ${usr.lastName}`,
      email: usr.email,
      students: studentName,
      role: usr.role,
      onShowMenu: currentUser.id !== usr.id ? onShowMenu : undefined,
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

export default UsersTable; 