import React from "react";
import {
  Box,
  Fab,
  IconButton,
  Tab,
  Tabs,
  Menu as PulldownMenu,
  MenuItem,
} from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import { useContext, useState } from "react";
import { Add, Delete, Edit, MoreVert } from "@mui/icons-material";
import { grey } from "@mui/material/colors";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridValidRowModel,
} from "@mui/x-data-grid";
import Student from "../../models/Student";
import StudentMealsDialog from "../meals/StudentMealsDialog";
import { useNavigate } from "react-router-dom";
import { USERS_URL } from "../../MainAppPanel";

interface Row {
  id: number;
  name: string;
  onShowMenu: (studentId: number, menuAnchor: HTMLElement) => void;
}


const columns: GridColDef[] = [
  { field: "name", headerName: "Student Name", flex: 1 },
  {
    field: "onShowMenu",
    headerName: "Actions",
    width: 80,
    renderCell: (
      params: GridRenderCellParams<GridValidRowModel, (studentId: number, menuAnchor: null | HTMLElement) => void>
    ) => (
      <IconButton
        color="primary"
        onClick={(event) =>
          params.value!(
            params.id as number,
            event.currentTarget
          )
        }
        size="small"
      >
        <MoreVert />
      </IconButton>
    ),
  },
];

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
      <MenuItem onClick={onEdit}>
        <Edit color="primary" />
      </MenuItem>
      <MenuItem onClick={onShowMeals}>
        <Delete color="primary" />
      </MenuItem>
    </PulldownMenu>
  );
};

type MenuAction = "edit" | "meals";

const StudentsPage: React.FC = () => {
  const { students } = useContext(AppContext);
  const [showNewUserDialog, setShowNewUserDialog] = useState(false);
  const [pulldownMenuAnchor, setPulldownMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [targetStudent, setTargetStudent] = useState<null | Student>(null);
  const [action, setAction] = useState<null | MenuAction>(null);
  
  const navigate = useNavigate();

  const handleShowPopupMenu = (
    studentId: number,
    menuAnchor: null | HTMLElement
  ) => {
    setTargetStudent(students.find((student) => student.id === studentId)!);
    setPulldownMenuAnchor(menuAnchor);
  };

  const handleActionComplete = () => {
    setTargetStudent(null);
    setAction(null);
  };

  const rows: Row[] = [];

  students.forEach((student) => {
    rows.push({
      id: student.id,
      name: student.name,
      onShowMenu: handleShowPopupMenu,
    });
  });

  const handleTabSelected = () => {
    navigate(USERS_URL);
  };

  const handleEditUser = () => {
    setAction("edit");
    setPulldownMenuAnchor(null);
  };

  // const handleCloseEditUserDialog = () => {
  //   setAction(null);
  //   setShowNewUserDialog(false);
  // };

  const handleShowMeals = () => {
    setAction("meals");
    setPulldownMenuAnchor(null);
  };

  const handleCloseMenu = () => {
    setTargetStudent(null);
    setPulldownMenuAnchor(null);
  };

  return (
    <Box
      pl={2}
      pr={2}
      sx={{
        display: "grid",
        rowGap: 1,
        height: "100%",
        gridTemplateRows: "auto 1fr",
        gridTemplateColumns: "1fr auto",
      }}
    >
      <Tabs
        value={'students'}
        onChange={handleTabSelected}
        aria-label="secondary tabs example"
      >
        <Tab value="users" label="Users" />
        <Tab value="students" label="Students" />
      </Tabs>
      <Fab
        size="small"
        onClick={() => setShowNewUserDialog(true)}
        color="primary"
        sx={{marginTop: "8px"}}
      >
        <Add />
      </Fab>
      <DataGrid
        sx={{
          marginBottom: "10px",
          gridColumn: "span 2",
          borderColor: grey[400],
          backgroundColor: "white",
        }}
        density="compact"
        rows={rows}
        disableRowSelectionOnClick
        columns={columns}
      />
      {showNewUserDialog || (action === 'edit') ? (
        <></>
        // <EditUserDialog student={showNewUserDialog ? undefined : targetStudent!} onClose={handleCloseEditUserDialog} />
      ) : (
        <></>
      )}
      {targetStudent && pulldownMenuAnchor ? (
          <StudentMenu
            anchor={pulldownMenuAnchor!}
            onEdit={handleEditUser}
            onShowMeals={handleShowMeals}
            onClose={handleCloseMenu}
          />
        ) : (
          <></>
        )
      }
      {action === "meals" && targetStudent ? (
        <StudentMealsDialog student={targetStudent} onClose={handleActionComplete} />
      ) : (
        <></>
      )}
    </Box>
  );
};

export default StudentsPage;
