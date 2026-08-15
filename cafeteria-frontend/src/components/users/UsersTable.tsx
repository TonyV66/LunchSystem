import React, { useEffect, useMemo } from "react";
import {
  IconButton,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import { MoreVert } from "@mui/icons-material";
import { grey } from "@mui/material/colors";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import { getRoleName, AccountStatus } from "../../models/User";
import SchoolUser from "../../models/SchoolUser";
import { AppContext } from "../../AppContextProvider";
import Student from "../../models/Student";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isUuidUsername = (username: string): boolean =>
  UUID_PATTERN.test(username.trim());

interface Row {
  id: number;
  username: string;
  name: string;
  studentName: string;
  studentCount: number;
  students: Student[];
  role: string;
}

interface UsersTableProps {
  includeRegisteredUsers: boolean;
  includePendingUsers: boolean;
  onShowMenu: (userId: number, menuAnchor: null | HTMLElement) => void;
}

const UsersTable: React.FC<UsersTableProps> = ({
  includeRegisteredUsers,
  includePendingUsers,
  onShowMenu,
}) => {
  const { students, orders, users } = React.useContext(AppContext);
  const [selectedStudents, setSelectedStudents] = React.useState<Student[]>([]);
  const [showStudentsDialog, setShowStudentsDialog] = React.useState(false);
  const [filteredUsers, setFilteredUsers] = React.useState<SchoolUser[]>([]);

  const handleShowAllStudents = (studentsToShow: Student[]) => {
    setSelectedStudents(studentsToShow);
    setShowStudentsDialog(true);
  };

  const handleCloseStudentsDialog = () => {
    setShowStudentsDialog(false);
    setSelectedStudents([]);
  };

  useEffect(() => {
    const matched = users.filter((user) => {
      const status = user.accountStatus;
      return (
        (includeRegisteredUsers && status === AccountStatus.ACTIVE) ||
        (includePendingUsers && status === AccountStatus.PENDING)
      );
    });

    // DataGrid virtualization breaks when row ids are duplicated.
    const byId = new Map<number, SchoolUser>();
    for (const user of matched) {
      byId.set(user.id, user);
    }
    setFilteredUsers(Array.from(byId.values()));
  }, [includeRegisteredUsers, includePendingUsers, users]);

  const columns: GridColDef<Row>[] = useMemo(
    () => [
      { field: "name", headerName: "Name", flex: 1, minWidth: 120 },
      { field: "username", headerName: "Username", flex: 2, minWidth: 120 },
      {
        field: "studentName",
        headerName: "Children",
        flex: 1,
        minWidth: 120,
        renderCell: (params: GridRenderCellParams<Row, string>) => {
          const count = params.row.studentCount;
          const name = params.value ?? "";
          if (count <= 1) {
            return name;
          }
          return (
            <Link
              component="button"
              variant="body2"
              onClick={() => handleShowAllStudents(params.row.students)}
              sx={{ textDecoration: "underline", cursor: "pointer" }}
            >
              {name + " +" + (count - 1)}
            </Link>
          );
        },
      },
      { field: "role", headerName: "Role", flex: 1, minWidth: 100 },
      {
        field: "actions",
        headerName: "Actions",
        width: 80,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params: GridRenderCellParams<Row>) => (
          <IconButton
            color="primary"
            onClick={(event) => onShowMenu(params.row.id, event.currentTarget)}
            size="small"
          >
            <MoreVert />
          </IconButton>
        ),
      },
    ],
    [onShowMenu],
  );

  const rows: Row[] = useMemo(
    () =>
      filteredUsers.map((usr) => {
        const userStudents = students.filter(
          (student) => student.parents && student.parents.includes(usr.id),
        );

        const sortedStudents = [...userStudents].sort((a, b) => {
          const nameA = `${a.firstName} ${a.lastName}`;
          const nameB = `${b.firstName} ${b.lastName}`;
          return nameA.localeCompare(nameB);
        });

        let studentName = "";
        if (sortedStudents.length > 0) {
          const studentWithOrder = sortedStudents.find((student) =>
            orders.some((order) =>
              order.meals.some((meal) => meal.studentId === student.id),
            ),
          );

          if (studentWithOrder) {
            studentName = `${studentWithOrder.firstName} ${studentWithOrder.lastName}`;
          } else {
            const firstStudent = sortedStudents[0];
            studentName = `${firstStudent.firstName} ${firstStudent.lastName}`;
          }
        }

        return {
          id: usr.id,
          username: isUuidUsername(usr.userName) ? "" : usr.userName,
          name: `${usr.firstName} ${usr.lastName}`,
          studentName,
          studentCount: sortedStudents.length,
          students: sortedStudents,
          role: getRoleName(usr.role),
        };
      }),
    [filteredUsers, students, orders],
  );

  return (
    <Box sx={{ flex: 1, minHeight: 0, width: "100%", display: "flex", flexDirection: "column" }}>
      <DataGrid
        sx={{
          flex: 1,
          borderColor: grey[400],
          backgroundColor: "white",
          "& .MuiDataGrid-cell": {
            overflow: "hidden",
          },
        }}
        density="compact"
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        disableRowSelectionOnClick
      />

      <Dialog
        open={showStudentsDialog}
        onClose={handleCloseStudentsDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>All Students</DialogTitle>
        <DialogContent>
          <List dense>
            {selectedStudents.map((student) => (
              <ListItem key={student.id}>
                <Typography variant="body2">
                  {student.firstName} {student.lastName}
                </Typography>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStudentsDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersTable;
