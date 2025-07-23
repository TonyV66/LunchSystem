import * as React from "react";
import {
  AppBar,
  Box,
  Dialog,
  Fab,
  IconButton,
  Slide,
  Toolbar,
  Typography,
} from "@mui/material";
import { Add, Close } from "@mui/icons-material";
import { TransitionProps } from "@mui/material/transitions";
import User from "../../models/User";
import StudentsTable from "./StudentsTable";
import { useContext, useState } from "react";
import { AppContext } from "../../AppContextProvider";
import AdminNewStudentDialog from "./AdminNewStudentDialog";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<unknown>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export const SiblingsDialog: React.FC<{
  user: User;
  onClose: () => void;
}> = ({ user, onClose }) => {
  const { currentSchoolYear } = useContext(AppContext);
  const [showNewStudentDialog, setShowNewStudentDialog] = useState(false);

  const handleCloseDialog = () => {
    setShowNewStudentDialog(false);
  };

  return (
    <>
      <Dialog
        open={true}
        fullScreen
        onClose={onClose}
        TransitionComponent={Transition}
      >
        <AppBar sx={{ position: "relative" }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={onClose}
              aria-label="close"
            >
              <Close />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              Children of {user.firstName} {user.lastName}
            </Typography>
          </Toolbar>
        </AppBar>
        <Box>
          <Fab
            size="small"
            onClick={() => setShowNewStudentDialog(true)}
            color="primary"
            disabled={!currentSchoolYear.id}
            sx={{ marginTop: "8px" }}
          >
            <Add />
          </Fab>
        </Box>
        <Box flexGrow={1} p={2}>
          <StudentsTable user={user} family={true} />
        </Box>
      </Dialog>
      {showNewStudentDialog && <AdminNewStudentDialog onClose={handleCloseDialog} parent={user} />}
    </>
  );
};
