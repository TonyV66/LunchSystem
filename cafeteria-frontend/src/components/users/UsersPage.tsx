import React from "react";
import {
  Fab,
  Menu as PulldownMenu,
  MenuItem as MuiMenuItem,
  Stack,
  Typography,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import { useContext, useState } from "react";
import { Add } from "@mui/icons-material";
import { AccountStatus, Role } from "../../models/User";
import SchoolUser from "../../models/SchoolUser";
import { USERS_URL } from "../../MainAppPanel";
import { UserOrderHistoryDialog } from "../orders/UserOrderHistoryDialog";
import EditUserDialog from "./EditUserDialog";
import CreateUserDialog from "./CreateUserDialog";
import UsersTable from "./UsersTable";
import { SiblingsDialog } from "./SiblingsDialog";
import PeopleTabs from "./PeopleTabs";
import { UpcomingMealsDialog } from "../meals/UpcomingMealsDialog";
import ConfirmDialog from "../ConfirmDialog";
import { createInvitation } from "../../api/CafeteriaClient";
import { AxiosError } from "axios";

interface UserMenuProps {
  anchor: HTMLElement;
  isPending: boolean;
  onOrderHistory: () => void;
  onShowMeals: () => void;
  onEdit: () => void;
  onResendInvite: () => void;
  onClose: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({
  anchor,
  isPending,
  onEdit,
  onOrderHistory,
  onShowMeals,
  onResendInvite,
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
      {isPending ? (
        <MuiMenuItem onClick={onResendInvite}>Resend Invite</MuiMenuItem>
      ) : (
        <>
          <MuiMenuItem onClick={onOrderHistory}>Order History</MuiMenuItem>
          <MuiMenuItem onClick={onShowMeals}>Upcoming Meals</MuiMenuItem>
        </>
      )}
      {user.role === Role.ADMIN && (
        <MuiMenuItem onClick={onEdit}>Edit</MuiMenuItem>
      )}
    </PulldownMenu>
  );
};

type MenuAction = "edit" | "delete" | "history" | "children" | "meals" | "resend";

const UsersPage: React.FC = () => {
  const {
    users,
    setUsers,
    currentSchoolYear,
    setSnackbarMsg,
    setSnackbarErrorMsg,
  } = useContext(AppContext);
  const [showNewUserDialog, setShowNewUserDialog] = useState(false);
  const [pulldownMenuAnchor, setPulldownMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [targetUser, setTargetUser] = useState<null | SchoolUser>(null);
  const [action, setAction] = useState<null | MenuAction>(null);
  const [includeRegisteredUsers, setIncludeRegisteredUsers] = useState(true);
  const [includePendingUsers, setIncludePendingUsers] = useState(false);
  const [resendingInvite, setResendingInvite] = useState(false);

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

  const handleResendInvite = () => {
    setAction("resend");
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

  const handleConfirmResendInvite = async () => {
    if (!targetUser) {
      return;
    }
    const email = targetUser.email?.trim();
    if (!email) {
      setSnackbarErrorMsg("This user does not have an email address.");
      handleActionComplete();
      return;
    }

    setResendingInvite(true);
    try {
      const updated = await createInvitation(
        targetUser.firstName,
        targetUser.lastName,
        email,
        targetUser.role
      );
      setUsers(users.map((user) => (user.id === updated.id ? updated : user)));
      setSnackbarMsg("Invitation resent");
      handleActionComplete();
    } catch (error) {
      const axiosError = error as AxiosError;
      setSnackbarErrorMsg(
        "Error resending invitation: " +
          (axiosError.response?.data?.toString() ??
            axiosError.response?.statusText ??
            "Unknown server error")
      );
    } finally {
      setResendingInvite(false);
    }
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
      {showNewUserDialog ? (
        <CreateUserDialog onClose={handleCloseEditUserDialog} />
      ) : (
        <></>
      )}
      {action === "edit" && targetUser ? (
        <EditUserDialog
          user={targetUser}
          onClose={handleCloseEditUserDialog}
        />
      ) : (
        <></>
      )}
      {targetUser && pulldownMenuAnchor ? (
        <UserMenu
          anchor={pulldownMenuAnchor!}
          isPending={targetUser.accountStatus === AccountStatus.PENDING}
          onOrderHistory={handleOrderHistory}
          onShowMeals={handleShowMeals}
          onEdit={handleEditUser}
          onResendInvite={handleResendInvite}
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
      {action === "resend" && targetUser ? (
        <ConfirmDialog
          title="Resend Invitation"
          open={true}
          okLabel="Send"
          isOkDisabled={resendingInvite || !targetUser.email?.trim()}
          onOk={handleConfirmResendInvite}
          onCancel={handleActionComplete}
        >
          <Typography variant="body2">
            {targetUser.email?.trim()
              ? `Resend the invitation email to ${targetUser.email.trim()}?`
              : "This user does not have an email address, so an invitation cannot be sent."}
          </Typography>
        </ConfirmDialog>
      ) : (
        <></>
      )}
    </Stack>
  );
};

export default UsersPage;
