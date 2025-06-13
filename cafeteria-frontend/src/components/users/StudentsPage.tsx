import React from "react";
import {
  IconButton,
  Tab,
  Tabs,
  Menu as PulldownMenu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import { useContext, useState } from "react";
import { MoreVert } from "@mui/icons-material";
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
import { STUDENTS_URL, USERS_URL } from "../../MainAppPanel";
import EditStudentDialog from "./EditStudentDialog";

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
      <MenuItem onClick={onShowMeals} disabled={!currentSchoolYear.id}>Ordered Meals</MenuItem>
    </PulldownMenu>
  );
};

type MenuAction = "edit" | "meals";

const StudentsPage: React.FC = () => {
  const { students, currentSchoolYear } = useContext(AppContext);
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

  const handleTabSelected = (event: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

  const handleEditUser = () => {
    setAction("edit");
    setPulldownMenuAnchor(null);
  };

  const handleCloseStudentDialog = () => {
    setAction(null);
  };

  const handleShowMeals = () => {
    setAction("meals");
    setPulldownMenuAnchor(null);
  };

  const handleCloseMenu = () => {
    setTargetStudent(null);
    setPulldownMenuAnchor(null);
  };

  return (
    <Stack
      pl={2}
      pr={2}
      direction="column"
      gap={1}
      sx={{
        height: "100%",
      }}
    >
      <Stack direction="row" justifyContent="space-between">
        <Tabs
          value={STUDENTS_URL}
          onChange={handleTabSelected}
          aria-label="secondary tabs example"
        >
          <Tab value={USERS_URL} label="Users" />
          <Tab value={STUDENTS_URL} label="Students" />
        </Tabs>
        <Stack direction="column">
          <Typography variant="body2" fontWeight="bold">
            School Year:
          </Typography>
          <Typography
            variant="body2"
            color={!currentSchoolYear.id ? "error" : "text.primary"}
          >
            {currentSchoolYear.name || "No School Year Selected"}
          </Typography>
        </Stack>

      </Stack>

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
      {action === "edit" ? (
        <EditStudentDialog
          student={targetStudent!}
          onClose={handleCloseStudentDialog}
        />
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
      )}
      {action === "meals" && targetStudent ? (
        <StudentMealsDialog
          student={targetStudent}
          onClose={handleActionComplete}
        />
      ) : (
        <></>
      )}
    </Stack>
  );
};

export default StudentsPage;
