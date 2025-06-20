import React from "react";
import {
  Fab,
  Tab,
  Tabs,
  Menu as PulldownMenu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import { useContext, useState } from "react";
import { Add } from "@mui/icons-material";
import User, { Role } from "../../models/User";
import { useNavigate } from "react-router-dom";
import { STUDENTS_URL, USERS_URL } from "../../MainAppPanel";
import { UserOrderHistoryDialog } from "../orders/UserOrderHistoryDialog";
import EditUserDialog from "./EditUserDialog";
import UsersTable from "./UsersTable";

interface AdminMenuProps {
  anchor: HTMLElement;
  onEdit: () => void;
  onClose: () => void;
}

interface ParentMenuProps {
  anchor: HTMLElement;
  onOrderHistory: () => void;
  onClose: () => void;
}

const ParentMenu: React.FC<ParentMenuProps> = ({
  anchor,
  onOrderHistory,
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
      <MenuItem onClick={onOrderHistory}>Order History</MenuItem>
    </PulldownMenu>
  );
};

const StaffMenu: React.FC<AdminMenuProps> = ({ anchor, onEdit, onClose }) => {
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
    </PulldownMenu>
  );
};

type MenuAction = "edit" | "delete" | "history";

const UsersPage: React.FC = () => {
  const { users, user, currentSchoolYear } = useContext(AppContext);
  const [showNewUserDialog, setShowNewUserDialog] = useState(false);
  const [pulldownMenuAnchor, setPulldownMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [targetUser, setTargetUser] = useState<null | User>(null);
  const [action, setAction] = useState<null | MenuAction>(null);

  const navigate = useNavigate();

  const handleShowPopupMenu = (
    userId: number,
    menuAnchor: null | HTMLElement
  ) => {
    setTargetUser(users.find((user) => user.id === userId)!);
    setPulldownMenuAnchor(menuAnchor);
  };

  const handleActionComplete = () => {
    setTargetUser(null);
    setAction(null);
  };

  const handleTabSelected = (event: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

  const handleEditUser = () => {
    setAction("edit");
    setPulldownMenuAnchor(null);
  };

  const handleOrderHistory = () => {
    setAction("history");
    setPulldownMenuAnchor(null);
  };

  const handleCloseEditUserDialog = () => {
    setAction(null);
    setShowNewUserDialog(false);
  };

  const handleCloseMenu = () => {
    setTargetUser(null);
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
      <Stack direction="row" alignItems="center" gap={2}>
        <Tabs
          sx={{ flexGrow: 1 }}
          value={USERS_URL}
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
        <Fab
          size="small"
          onClick={() => setShowNewUserDialog(true)}
          color="primary"
          disabled={!currentSchoolYear.id}
          sx={{ marginTop: "8px" }}
        >
          <Add />
        </Fab>
      </Stack>
      <UsersTable
        users={users}
        currentUser={user}
        onShowMenu={handleShowPopupMenu}
      />
      {showNewUserDialog || action === "edit" ? (
        <EditUserDialog
          user={showNewUserDialog ? undefined : targetUser!}
          onClose={handleCloseEditUserDialog}
        />
      ) : (
        <></>
      )}
      {targetUser && pulldownMenuAnchor ? (
        targetUser.role !== Role.PARENT ? (
          <StaffMenu
            anchor={pulldownMenuAnchor!}
            onEdit={handleEditUser}
            onClose={handleCloseMenu}
          />
        ) : (
          <ParentMenu
            anchor={pulldownMenuAnchor!}
            onOrderHistory={handleOrderHistory}
            onClose={handleCloseMenu}
          />
        )
      ) : (
        <></>
      )}
      {action === "history" && targetUser ? (
        <UserOrderHistoryDialog
          user={targetUser}
          onClose={handleActionComplete}
        />
      ) : (
        <></>
      )}
    </Stack>
  );
};

export default UsersPage;
