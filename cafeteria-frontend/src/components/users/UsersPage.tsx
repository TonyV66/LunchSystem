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
import { Add, Delete, Edit, MoreVert, ReceiptLong } from "@mui/icons-material";
import User, { Role, ROLE_NAMES } from "../../models/User";
import { grey } from "@mui/material/colors";
import EditUserDialog from "./EditUserDialog";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridValidRowModel,
} from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import { STUDENTS_URL } from "../../MainAppPanel";
import { UserOrderHistoryDialog } from "../orders/UserOrderHistoryDialog";

interface Row {
  id: number;
  username: string;
  role: string;
  onShowMenu: undefined | ((userId: number, menuAnchor: HTMLElement) => void);
}


const columns: GridColDef[] = [
  { field: "username", headerName: "User Name", minWidth: 150 },
  { field: "role", headerName: "Role", flex: 1 },
  {
    field: "onShowMenu",
    headerName: "Actions",
    width: 80,
    renderCell: (
      params: GridRenderCellParams<GridValidRowModel, (userId: number, menuAnchor: null | HTMLElement) => void>
    ) => (
      <IconButton
        color="primary"
        disabled={!params.value}
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

interface AdminMenuProps {
  anchor: HTMLElement;
  onEdit: () => void;
  onDelete: () => void;
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
      <MenuItem onClick={onOrderHistory}>
        <ReceiptLong color="primary" />
      </MenuItem>
    </PulldownMenu>
  );
};

interface AdminMenuProps {
  anchor: HTMLElement;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const StaffMenu: React.FC<AdminMenuProps> = ({
  anchor,
  onEdit,
  onDelete,
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
      <MenuItem onClick={onDelete}>
        <Delete color="primary" />
      </MenuItem>
    </PulldownMenu>
  );
};

type MenuAction = "edit" | "delete" | "history";

const UsersPage: React.FC = () => {
  const { users, user } = useContext(AppContext);
  const [showNewUserDialog, setShowNewUserDialog] = useState(false);
  const [pulldownMenuAnchor, setPulldownMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [targetUser, setTargetUser] = useState<null | User>(null);
  const [action, setAction] = useState<null | MenuAction>(null);

  const navigate = useNavigate()

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
      role: ROLE_NAMES[usr.role],
      onShowMenu: user.id !== usr.id ? handleShowPopupMenu : undefined,
    });
  });


  const handleTabSelected = () => {
    navigate(STUDENTS_URL);
  };

  const handleEditUser = () => {
    setAction("edit");
    setPulldownMenuAnchor(null);
  };

  const handleCloseEditUserDialog = () => {
    setAction(null);
    setShowNewUserDialog(false);
  };

  const handleOrderHistory = () => {
    setAction("history");
    setPulldownMenuAnchor(null);
  };

  const handleDeleteUser = () => {
    setTargetUser(null);
    setPulldownMenuAnchor(null);
  };

  const handleCloseMenu = () => {
    setTargetUser(null);
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
        value={'users'}
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
        <EditUserDialog user={showNewUserDialog ? undefined : targetUser!} onClose={handleCloseEditUserDialog} />
      ) : (
        <></>
      )}
      {targetUser && pulldownMenuAnchor ? (
        targetUser.role !== Role.PARENT ? (
          <StaffMenu
            anchor={pulldownMenuAnchor!}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
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
        <UserOrderHistoryDialog user={targetUser} onClose={handleActionComplete} />
      ) : (
        <></>
      )}
    </Box>
  );
};

export default UsersPage;
