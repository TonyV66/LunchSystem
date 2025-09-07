import React from "react";
import {
  Fab,
  Menu as PulldownMenu,
  MenuItem,
  Stack,
  Typography,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import { useContext, useState } from "react";
import { Add } from "@mui/icons-material";
import User, { Role } from "../../models/User";
import { USERS_URL } from "../../MainAppPanel";
import { UserOrderHistoryDialog } from "../orders/UserOrderHistoryDialog";
import EditUserDialog from "./EditUserDialog";
import UsersTable from "./UsersTable";
import { SiblingsDialog } from "./SiblingsDialog";
import UserImportDialog from "./UserImportDialog";
import PeopleTabs from "./PeopleTabs";
import { UpcomingMealsDialog } from "../meals/UpcomingMealsDialog";

interface UserMenuProps {
  anchor: HTMLElement;
  onOrderHistory: () => void;
  onShowMeals: () => void;
  onEdit: () => void;
  onClose: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({
  anchor,
  onEdit,
  onOrderHistory,
  onShowMeals,
  onClose,
}) => {
  const { user } = useContext(AppContext);

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
      <MenuItem onClick={onShowMeals}>
        Upcoming Meals
      </MenuItem>
      {user.role === Role.ADMIN && <MenuItem onClick={onEdit}>Edit</MenuItem>}
    </PulldownMenu>
  );
};

type MenuAction = "edit" | "delete" | "history" | "children" | "meals";

const UsersPage: React.FC = () => {
  const { users, currentSchoolYear } = useContext(AppContext);
  const [showNewUserDialog, setShowNewUserDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [pulldownMenuAnchor, setPulldownMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [targetUser, setTargetUser] = useState<null | User>(null);
  const [action, setAction] = useState<null | MenuAction>(null);
  const [includeRegisteredUsers, setIncludeRegisteredUsers] = useState(true);
  const [includePendingUsers, setIncludePendingUsers] = useState(false);

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

  const handleEditUser = () => {
    setAction("edit");
    setPulldownMenuAnchor(null);
  };

  const handleOrderHistory = () => {
    setAction("history");
    setPulldownMenuAnchor(null);
  };

  const handleShowMeals = () => {
    setAction("meals");
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

  const handleCloseImportDialog = () => {
    setShowImportDialog(false);
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
      <Stack
        direction="row"
        alignItems="center"
        gap={2}
        justifyContent="space-between"
      >
        <PeopleTabs value={USERS_URL} />
        <Stack direction="row" alignItems="center" gap={1}>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={includeRegisteredUsers}
                onChange={(e) => setIncludeRegisteredUsers(e.target.checked)}
              />
            }
            label={<Typography variant="body2">Registered Users</Typography>}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={includePendingUsers}
                onChange={(e) => setIncludePendingUsers(e.target.checked)}
              />
            }
            label={<Typography variant="body2">Pending Users</Typography>}
          />
        </Stack>
        <Stack direction="row" alignItems="center" gap={4}>
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
          >
            <Add />
          </Fab>
        </Stack>
      </Stack>
      <UsersTable
        includeRegisteredUsers={includeRegisteredUsers}
        includePendingUsers={includePendingUsers}
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
        <UserMenu
          anchor={pulldownMenuAnchor!}
          onOrderHistory={handleOrderHistory}
          onShowMeals={handleShowMeals}
          onEdit={handleEditUser}
          onClose={handleCloseMenu}
        />
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
      {action === "meals" && targetUser ? (
        <UpcomingMealsDialog
          user={targetUser}
          onClose={handleActionComplete}
        />
      ) : (
        <></>
      )}

      {action === "children" && targetUser ? (
        <SiblingsDialog user={targetUser} onClose={handleActionComplete} />
      ) : (
        <></>
      )}
      <UserImportDialog
        open={showImportDialog}
        onClose={handleCloseImportDialog}
      />
    </Stack>
  );
};

export default UsersPage;
