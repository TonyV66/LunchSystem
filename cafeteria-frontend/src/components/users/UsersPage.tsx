import React from "react";
import {
  Fab,
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
import { Add, MoreVert } from "@mui/icons-material";
import User, { Role, ROLE_NAMES } from "../../models/User";
import { grey } from "@mui/material/colors";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridValidRowModel,
} from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import { STUDENTS_URL, USERS_URL } from "../../MainAppPanel";
import { UserOrderHistoryDialog } from "../orders/UserOrderHistoryDialog";
import EditUserDialog from "./EditUserDialog";

interface Row {
  id: number;
  username: string;
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
  { field: "username", headerName: "User Name", minWidth: 150 },
  { field: "role", headerName: "Role", flex: 1, renderCell: roleCellRenderer },
  {
    field: "onShowMenu",
    headerName: "Actions",
    width: 80,
    renderCell: actionCellRenderer,
  },
];

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

  const rows: Row[] = [];

  users.forEach((usr) => {
    rows.push({
      id: usr.id,
      username: usr.userName,
      role: usr.role,
      onShowMenu: user.id !== usr.id ? handleShowPopupMenu : undefined,
    });
  });

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
