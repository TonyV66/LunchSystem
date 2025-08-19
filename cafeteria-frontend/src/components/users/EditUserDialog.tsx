import React, { useContext, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem as MuiMenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import User, { NULL_USER, Role } from "../../models/User";
import { AppContext } from "../../AppContextProvider";
import { createInvitation, updateUser } from "../../api/CafeteriaClient";
import { AxiosError } from "axios";

interface DialogProps {
  user?: User;
  onClose: () => void;
}

const EditUserDialog: React.FC<DialogProps> = ({ user, onClose }) => {
  const {
    users,
    setUsers,
    setSnackbarErrorMsg,
    setSnackbarMsg,
    user: loggedInUser,
  } = useContext(AppContext);

  const [role, setRole] = useState(
    user?.role.toString() ?? Role.PARENT.toString()
  );
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [properName, setProperName] = useState(user?.name ?? "");
  const [shouldSendInvitation, setShouldSendInvitation] = useState(!user);

  const handleRoleChanged = (roleName: string) => {
    setRole(roleName);
  };
  const isSaveDisabled = !email.length || !firstName.length || !lastName.length;

  const handleSaveUser = async () => {
    if (!user) {
      try {
        const invitedUser = await createInvitation(
          firstName,
          lastName,
          email,
          parseInt(role),
          shouldSendInvitation
        );
        setUsers(users.concat(invitedUser));
        setSnackbarMsg("Invitation sent");
        onClose();
      } catch (error) {
        const axiosError = error as AxiosError;
        setSnackbarErrorMsg(
          "Error updating user: " +
            (axiosError.response?.data?.toString() ??
              axiosError.response?.statusText ??
              "Unknown server error")
        );
      }

      return;
    }

    const updatedUser: User = {
      ...(user ?? NULL_USER),
      userName: user.userName,
      name: role === Role.TEACHER.toString() ? properName : "",
      firstName,
      lastName,
      email,
      pwd: "",
      role: parseInt(role),
      description: "",
    };

    try {
      const savedUser = await updateUser(updatedUser);
      setUsers(
        users.map((user) => (user.id === savedUser.id ? savedUser : user))
      );
      setSnackbarMsg("User updated");
      onClose();
    } catch (error) {
      const axiosError = error as AxiosError;
      setSnackbarErrorMsg(
        "Error updating user: " +
          (axiosError.response?.data?.toString() ??
            axiosError.response?.statusText ??
            "Unknown server error")
      );
    }
  };

  const roleNames = [
    "System Admin.",
    "Teacher",
    "Parent",
    "Cafeteria",
    "Staff",
  ];

  const availRoles: Role[] = [
    Role.PARENT,
    Role.STAFF,
    Role.TEACHER,
    Role.CAFETERIA,
    Role.ADMIN,
  ];
  let okButtonLabel = "Save";
  if (!user) {
    okButtonLabel = "Email Invitation";
  }

  return (
    <Dialog
      open={true}
      onClose={onClose}
      fullWidth={true}
      maxWidth="sm"
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle>{!user ? "New User" : "Edit User"}</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            pt: 1,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 2,
          }}
        >
          <TextField
            fullWidth
            required={true}
            label="First Name"
            variant="standard"
            value={firstName}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setFirstName(event.target.value)
            }
          />
          <TextField
            fullWidth
            required={true}
            label="Last Name"
            variant="standard"
            value={lastName}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setLastName(event.target.value)
            }
          />
          <TextField
            fullWidth
            required={true}
            label="Email"
            variant="standard"
            value={email}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(event.target.value)
            }
          />
          <FormControl fullWidth>
            <InputLabel id="userRoleLabel">Role</InputLabel>
            <Select
              labelId="userRoleLabel"
              variant="standard"
              id="userRoleSelector"
              value={role}
              label="Role"
              disabled={loggedInUser?.role === user?.role}
              onChange={(event: SelectChangeEvent) =>
                handleRoleChanged(event.target.value)
              }
            >
              {availRoles.map((ar) => (
                <MuiMenuItem key={ar} value={ar.toString()}>
                  {roleNames[ar]}
                </MuiMenuItem>
              ))}
            </Select>
          </FormControl>
          {role === Role.TEACHER.toString() && (
            <TextField
              fullWidth
              required={true}
              label="Reffered To As"
              variant="standard"
              value={properName}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setProperName(event.target.value)
              }
            />
          )}
          {!user && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={shouldSendInvitation}
                  onChange={(event) => setShouldSendInvitation(event.target.checked)}
                  name="sendInvitation"
                  color="primary"
                />
              }
              label="Send invitation email"
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => handleSaveUser()}
          disabled={isSaveDisabled}
        >
          {okButtonLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditUserDialog;
