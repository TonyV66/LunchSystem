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
} from "@mui/material";
import {
  getRoleName,
  isFactsUserRole,
  isSystemAdminRole,
  Role,
} from "../../models/User";
import SchoolUser from "../../models/SchoolUser";
import { AppContext } from "../../AppContextProvider";
import { updateUser } from "../../api/CafeteriaClient";
import { AxiosError } from "axios";

interface DialogProps {
  user: SchoolUser;
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

  const allRoles = Object.values(Role).filter(
    (value): value is Role => typeof value === "number",
  );
  const isFactsUser = isFactsUserRole(user.role);

  const availableRoles = allRoles.filter((r) =>
    isFactsUser ? isFactsUserRole(r) : !isFactsUserRole(r),
  );

  const [role, setRole] = useState(user.role.toString());
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email);
  const [properName, setProperName] = useState(user.name);
  const [availableCredits, setAvailableCredits] = useState(
    user.availableCredits.toFixed(2),
  );

  const handleRoleChanged = (roleName: string) => {
    setRole(roleName);
  };
  const isSaveDisabled = !email.length || !firstName.length || !lastName.length;

  const handleSaveUser = async () => {
    const updatedUser = {
      ...user,
      userName: user.userName,
      name: role === Role.TEACHER.toString() ? properName : "",
      firstName,
      lastName,
      email,
      pwd: "",
      role: parseInt(role),
      accountStatus: user.accountStatus,
      availableCredits: parseFloat(availableCredits),
      surveyCompleted: user.surveyCompleted,
      factsId: user.factsId,
    };

    try {
      const savedUser = await updateUser(updatedUser);
      setUsers(users.map((u) => (u.id === savedUser.id ? savedUser : u)));
      setSnackbarMsg("User updated");
      onClose();
    } catch (error) {
      const axiosError = error as AxiosError;
      setSnackbarErrorMsg(
        "Error updating user: " +
          (axiosError.response?.data?.toString() ??
            axiosError.response?.statusText ??
            "Unknown server error"),
      );
    }
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      fullWidth={true}
      maxWidth="sm"
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle>Edit User</DialogTitle>
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
            label="Username"
            variant="standard"
            value={user.userName}
            disabled
          />
          <FormControl fullWidth>
            <InputLabel id="userRoleLabel">Role</InputLabel>
            <Select
              labelId="userRoleLabel"
              variant="standard"
              id="userRoleSelector"
              value={role}
              label="Role"
              disabled={loggedInUser?.role === user.role}
              onChange={(event: SelectChangeEvent) =>
                handleRoleChanged(event.target.value)
              }
            >
              {availableRoles.map((ar) => (
                <MuiMenuItem key={ar} value={ar.toString()}>
                  {getRoleName(ar)}
                </MuiMenuItem>
              ))}
            </Select>
          </FormControl>

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
          {role === Role.TEACHER.toString() && (
            <TextField
              fullWidth
              required={true}
              label="Referred To As"
              variant="standard"
              value={properName}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setProperName(event.target.value)
              }
            />
          )}
          {isSystemAdminRole(user.role) ? (
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
          ) : (
            <TextField
              fullWidth
              label="Available Credits"
              variant="standard"
              value={availableCredits}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setAvailableCredits(event.target.value);
              }}
              disabled={loggedInUser?.role !== Role.ADMIN}
              type="number"
              inputProps={{ step: "0.01", min: "0" }}
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
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditUserDialog;
