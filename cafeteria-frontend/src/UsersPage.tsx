import React from "react";
import "./App.css";
import {
  Box,
  IconButton,
  Menu as PulldownMenu,
  MenuItem,
  Paper,
  Typography,
  Fab,
} from "@mui/material";
import { AppContext } from "./AppContextProvider";
import { useContext, useState } from "react";
import { Add, Delete, Edit, MoreVert, ReceiptLong } from "@mui/icons-material";
import User, { Role } from "./models/User";
import { grey, green, purple, orange } from "@mui/material/colors";
import { OrderHistoryDialog } from "./components/OrderHistory";

const ParentButtons: React.FC<{ user: User }> = ({ user }) => {
  const {orders} = useContext(AppContext);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  return (
    <>
      <IconButton disabled={!orders.find(order => order.userId === user.id)} color="primary" onClick={() => setShowOrderHistory(true)} size="small">
        <ReceiptLong />
      </IconButton>
      {showOrderHistory ? <OrderHistoryDialog user={user} onClose={() => setShowOrderHistory(false)}/> : <></>}
    </>
  );
};

const AdminButtons: React.FC<{ user: User }> = ({ user }) => {
  const [pulldownMenuAnchor, setPulldownMenuAnchor] =
    useState<null | HTMLElement>(null);

  console.log(user);
  const handleCloseMenu = () => {
    setPulldownMenuAnchor(null);
  };

  const handleShowMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setPulldownMenuAnchor(event.currentTarget);
  };

  const handleEdit = () => {
    setPulldownMenuAnchor(null);
  };

  const handleDelete = () => {
    setPulldownMenuAnchor(null);
  };

  return (
    <Box>
      <IconButton color="primary" onClick={handleShowMenu} size="small">
        <MoreVert />
      </IconButton>
      {!pulldownMenuAnchor ? (
        <></>
      ) : (
        <PulldownMenu
          id="demo-positioned-menu"
          aria-labelledby="demo-positioned-button"
          anchorEl={pulldownMenuAnchor}
          open={true}
          onClose={handleCloseMenu}
          anchorOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
        >
          <MenuItem onClick={handleEdit}>
            <Edit color="primary" />
          </MenuItem>
          <MenuItem onClick={handleDelete}>
            <Delete color="primary" />
          </MenuItem>
        </PulldownMenu>
      )}
    </Box>
  );
};

const UserPanel: React.FC<{ user: User }> = ({ user }) => {
  let backgroundColor: string | undefined = undefined;
  switch (user.role) {
    case Role.ADMIN:
      backgroundColor = green[50];
      break;
    case Role.TEACHER:
      backgroundColor = purple[50];
      break;
    case Role.CAFETERIA:
      backgroundColor = orange[50];
      break;
  }
  return (
    <Paper
      elevation={3}
      sx={{
        backgroundColor,
        width: "200px",
        display: "flex",
        flexDirection: "column",
        pl: 1,
        pr: 1,
        pb: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Typography sx={{ flexGrow: 1 }} fontWeight="bold" variant="caption">
          {user.userName}
        </Typography>
        {user.role === Role.PARENT ? (
          <ParentButtons user={user} />
        ) : (
          <AdminButtons user={user} />
        )}
      </Box>
    </Paper>
  );
};

const UserRoleLegend: React.FC = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        gap: 1,
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          width: "16px",
          height: "16px",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: grey[300],
          backgroundColor: green[100],
          borderRadius: "50%",
        }}
      ></Box>
      <Typography variant="caption">Admin.</Typography>
      <Box
        sx={{
          width: "16px",
          height: "16px",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: grey[300],
          backgroundColor: purple[100],
          borderRadius: "50%",
        }}
      ></Box>
      <Typography variant="caption">Teacher</Typography>
      <Box
        sx={{
          width: "16px",
          height: "16px",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: grey[300],
          backgroundColor: orange[100],
          borderRadius: "50%",
        }}
      ></Box>
      <Typography variant="caption">Cafeteria</Typography>
    </Box>
  );
};

const UsersPage: React.FC = () => {
  const { users } = useContext(AppContext);

  const handleAddUser = () => {};
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Box>
        <Box
          sx={{
            pl: 2,
            pr: 2,
            pt: 2,
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "flex-end",
            gap: 1,
          }}
        >
          <Box flexGrow={1}>
            <UserRoleLegend />
          </Box>
          <Fab size="small" onClick={handleAddUser} color="primary">
            <Add />
          </Fab>
        </Box>
      </Box>

      <Box flexGrow={1} sx={{ overflow: "auto" }}>
        <Box
          sx={{
            pl: 2,
            pr: 2,
            pb: 2,
            minWidth: "680px",
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          {users
            .sort((u1, u2) =>
              u1.userName.toLowerCase().localeCompare(u2.userName.toLowerCase())
            )
            .map((user) => (
              <UserPanel key={user.id} user={user} />
            ))}
        </Box>
      </Box>
    </Box>
  );
};

export default UsersPage;
