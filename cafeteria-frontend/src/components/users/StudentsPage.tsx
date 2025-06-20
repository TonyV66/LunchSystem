import React from "react";
import {
  Tab,
  Tabs,
  Menu as PulldownMenu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import { useContext, useState } from "react";
import Student from "../../models/Student";
import StudentMealsDialog from "../meals/StudentMealsDialog";
import { useNavigate } from "react-router-dom";
import { STUDENTS_URL, USERS_URL } from "../../MainAppPanel";
import EditStudentDialog from "./EditStudentDialog";
import StudentsTable from "./StudentsTable";

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

      <StudentsTable students={students} onShowMenu={handleShowPopupMenu} />
      
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
