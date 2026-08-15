import React, { useContext, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem as MuiMenuItem,
  Select,
  SelectChangeEvent,
  TextField,
} from "@mui/material";
import { getRoleName, isFactsUserRole, Role } from "../../models/User";
import { AppContext } from "../../AppContextProvider";
import { createInvitation } from "../../api/CafeteriaClient";
import { AxiosError } from "axios";
import {
  meetsPasswordRequirements,
  PASSWORD_HELPER_TEXT,
} from "../../utils/PasswordUtils";

interface DialogProps {
  onClose: () => void;
}

const CreateUserDialog: React.FC<DialogProps> = ({ onClose }) => {
  const {
    users,
    setUsers,
    setSnackbarErrorMsg,
    setSnackbarMsg,
    school,
    currentSchoolYear,
  } = useContext(AppContext);

  const isFactsSchool = Boolean(school.factsApiKey);
  const hasActiveSchoolYear = Boolean(currentSchoolYear.id);
  const allRoles = Object.values(Role).filter(
    (value): value is Role => typeof value === "number"
  );

  const availableRoles = allRoles.filter((r) => {
    if (isFactsSchool && isFactsUserRole(r)) {
      return false;
    }
    if (!hasActiveSchoolYear && isFactsUserRole(r)) {
      return false;
    }
    return true;
  });

  const [role, setRole] = useState(
    (availableRoles[0] ?? Role.CAFETERIA).toString()
  );
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");

  const usesEmailAsUserName = isFactsUserRole(parseInt(role));
  const canProvideUserName = !usesEmailAsUserName;
  const trimmedUserName = userName.trim();
  const userNameInvalid = trimmedUserName.includes("@");
  const requiresPassword = Boolean(trimmedUserName);
  const passwordValid = meetsPasswordRequirements(password);

  const handleRoleChanged = (roleName: string) => {
    setRole(roleName);
    if (isFactsUserRole(parseInt(roleName))) {
      setUserName("");
      setPassword("");
    }
  };

  const isSaveDisabled =
    !email.length ||
    !firstName.length ||
    !lastName.length ||
    userNameInvalid ||
    (requiresPassword && !passwordValid);

  const handleSaveUser = async () => {
    try {
      const invited = await createInvitation(
        firstName,
        lastName,
        email,
        parseInt(role),
        canProvideUserName && trimmedUserName
          ? trimmedUserName
          : undefined,
        canProvideUserName && trimmedUserName ? password : undefined
      );
      setUsers(users.concat(invited));
      setSnackbarMsg(
        canProvideUserName && trimmedUserName
          ? "User created"
          : "Invitation sent"
      );
      onClose();
    } catch (error) {
      const axiosError = error as AxiosError;
      setSnackbarErrorMsg(
        "Error creating user: " +
          (axiosError.response?.data?.toString() ??
            axiosError.response?.statusText ??
            "Unknown server error")
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
      <DialogTitle>New User</DialogTitle>
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
        {/* TODO: Set label according to user role. */}
        {canProvideUserName && (
            <>
              <TextField
                fullWidth
                label="Email"
                variant="standard"
                value={userName}
                error={userNameInvalid}
                helperText={
                  userNameInvalid
                    ? "Username cannot contain '@'."
                    : "Optional. Do not include '@'. If a username is not provided, the user will be sent an invitation email."
                }
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setUserName(event.target.value);
                  if (!event.target.value.trim()) {
                    setPassword("");
                  }
                }}
              />
              {requiresPassword && (
                <TextField
                  fullWidth
                  required={true}
                  label="Password"
                  type="password"
                  variant="standard"
                  value={password}
                  error={password.length > 0 && !passwordValid}
                  helperText={PASSWORD_HELPER_TEXT}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setPassword(event.target.value)
                  }
                />
              )}
            </>
          )}
          {usesEmailAsUserName && (
            <FormHelperText sx={{ gridColumn: "1 / -1", mx: 0 }}>
              An invitation email will be sent to this user.
            </FormHelperText>
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
          {canProvideUserName && trimmedUserName
            ? "Create"
            : "Email Invitation"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateUserDialog;
