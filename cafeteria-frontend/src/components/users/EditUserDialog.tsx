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
  Typography,
} from "@mui/material";
import User, { NULL_USER, Role } from "../../models/User";
import { AppContext } from "../../AppContextProvider";
import TimeSelector from "../TimeSelector";
import { createUser, updateUser } from "../../api/CafeteriaClient";
import { DayOfWeek } from "../../models/DailyLunchTime";
import { AxiosError } from "axios";

interface DialogProps {
  user?: User;
  onClose: () => void;
}

const EditUserDialog: React.FC<DialogProps> = ({ user, onClose }) => {
  const { users, setUsers, schoolYear, setSnackbarErrorMsg } = useContext(AppContext);

  const [role, setRole] = useState(
    user?.role.toString() ?? Role.PARENT.toString()
  );
  const [pwd, setPwd] = useState("");
  const [confirmationPwd, setConfirmationPwd] = useState("");
  const [fullName, setFullName] = useState(user?.name ?? "");
  const [userName, setUserName] = useState(user?.userName ?? "");
  const [description, setDescription] = useState(user?.description ?? "");
  const [mondayLunchTime, setMondayLunchTime] = useState(
    user?.role === Role.TEACHER
      ? user.lunchTimes
          .filter((lt) => lt.dayOfWeek === DayOfWeek.MONDAY)
          .map((lt) => lt.time)
          .sort()[0] ?? ""
      : schoolYear.lunchTimes
          .filter((lt) => lt.dayOfWeek === DayOfWeek.MONDAY)
          .map((lt) => lt.time)
          .sort()[0] ?? ""
  );
  const [tuesdayLunchTime, setTuesdayLunchTime] = useState(
    user?.role === Role.TEACHER
      ? user.lunchTimes
          .filter((lt) => lt.dayOfWeek === DayOfWeek.TUESDAY)
          .map((lt) => lt.time)
          .sort()[0] ?? ""
      : schoolYear.lunchTimes
          .filter((lt) => lt.dayOfWeek === DayOfWeek.TUESDAY)
          .map((lt) => lt.time)
          .sort()[0] ?? ""
  );
  const [wednesdayLunchTime, setWednesdayLunchTime] = useState(
    user?.role === Role.TEACHER
      ? user.lunchTimes
          .filter((lt) => lt.dayOfWeek === DayOfWeek.WEDNESDAY)
          .map((lt) => lt.time)
          .sort()[0] ?? ""
      : schoolYear.lunchTimes
          .filter((lt) => lt.dayOfWeek === DayOfWeek.WEDNESDAY)
          .map((lt) => lt.time)
          .sort()[0] ?? ""
  );
  const [thursdayLunchTime, setThursdayLunchTime] = useState(
    user?.role === Role.TEACHER
      ? user.lunchTimes
          .filter((lt) => lt.dayOfWeek === DayOfWeek.THURSDAY)
          .map((lt) => lt.time)
          .sort()[0] ?? ""
      : schoolYear.lunchTimes
          .filter((lt) => lt.dayOfWeek === DayOfWeek.THURSDAY)
          .map((lt) => lt.time)
          .sort()[0] ?? ""
  );
  const [fridayLunchTime, setFridayLunchTime] = useState(
    user?.role === Role.TEACHER
      ? user.lunchTimes
          .filter((lt) => lt.dayOfWeek === DayOfWeek.FRIDAY)
          .map((lt) => lt.time)
          .sort()[0] ?? ""
      : schoolYear.lunchTimes
          .filter((lt) => lt.dayOfWeek === DayOfWeek.FRIDAY)
          .map((lt) => lt.time)
          .sort()[0] ?? ""
  );

  function hasWhiteSpace(s: string) {
    return /\s/g.test(s);
  }
  const isSaveDisabled =
    ((parseInt(role) === Role.TEACHER) && !fullName.length) ||
    (!user &&
      (!pwd.length ||
        !userName.length ||
        hasWhiteSpace(pwd) ||
        hasWhiteSpace(userName) ||
        confirmationPwd !== pwd));

  const handleSaveUser = async () => {
    const updatedUser: User = {
      ...(user ?? NULL_USER),
      userName,
      name: fullName,
      pwd,
      role: parseInt(role),
      description,
    };

    if (updatedUser.role === Role.TEACHER) {
      updatedUser.lunchTimes = [
        { id: 0, dayOfWeek: DayOfWeek.MONDAY, time: mondayLunchTime },
        { id: 0, dayOfWeek: DayOfWeek.TUESDAY, time: tuesdayLunchTime },
        { id: 0, dayOfWeek: DayOfWeek.WEDNESDAY, time: wednesdayLunchTime },
        { id: 0, dayOfWeek: DayOfWeek.THURSDAY, time: thursdayLunchTime },
        { id: 0, dayOfWeek: DayOfWeek.FRIDAY, time: fridayLunchTime },
      ];
    }

    if (user) {
      try {
        const savedUser = await updateUser(updatedUser);
        setUsers(
          users.map((user) => (user.id === savedUser.id ? savedUser : user))
        );
        onClose();
      } catch (error) {
        const axiosError = error as AxiosError;
        setSnackbarErrorMsg(
          "Error updating user: " +
          (axiosError.response?.data?.toString() ?? axiosError.response?.statusText ?? "Unknown server error")
        );
      }
    } else {
      try {
        const savedUser = await createUser(updatedUser);
        setUsers(users.concat(savedUser));
        onClose();
      } catch (error) {
        const axiosError = error as AxiosError;
        setSnackbarErrorMsg(
          "Error creating user: " +
          (axiosError.response?.data?.toString() ?? axiosError.response?.statusText ?? "Unknown server error")
        );
      }
    }
  };

  const roleNames = ["System Admin.", "Teacher", "Parent", "Cafeteria"];

  const availRoles: Role[] = !user
    ? [Role.PARENT, Role.TEACHER, Role.CAFETERIA, Role.ADMIN]
    : [];
  if (role === Role.PARENT.toString()) {
    availRoles.push(Role.PARENT);
  }
  if (role === Role.TEACHER.toString()) {
    availRoles.push(Role.TEACHER);
  }
  if (role === Role.ADMIN.toString() || role === Role.CAFETERIA.toString()) {
    availRoles.push(Role.CAFETERIA);
    availRoles.push(Role.ADMIN);
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
            gridTemplateColumns: "1fr 1fr auto",
            gap: 2,
          }}
        >
          <TextField
            fullWidth
            required
            disabled={user ? true : false}
            label="Username"
            variant="standard"
            value={userName}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setUserName(event.target.value)
            }
          />
          <TextField
            fullWidth
            required={parseInt(role) === Role.TEACHER}
            label="First & Last Name"
            variant="standard"
            value={fullName}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setFullName(event.target.value)
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
              disabled={
                user?.role === Role.TEACHER || user?.role === Role.PARENT
              }
              onChange={(event: SelectChangeEvent) =>
                setRole(event.target.value)
              }
            >
              {availRoles.map((ar) => (
                <MuiMenuItem key={ar} value={ar.toString()}>
                  {roleNames[ar]}
                </MuiMenuItem>
              ))}
            </Select>
          </FormControl>
          {!user ? (
            <>
              <TextField
                fullWidth
                required
                type="Password"
                label="Password"
                variant="standard"
                value={pwd}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setPwd(event.target.value)
                }
              />
              <TextField
                fullWidth
                required
                type="Password"
                label="Confirm Password"
                variant="standard"
                value={confirmationPwd}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setConfirmationPwd(event.target.value)
                }
              />
              <Box></Box>
            </>
          ) : (
            <></>
          )}
          {role === Role.TEACHER.toString() ? (
            <>
              <Box sx={{ gridColumn: "span 3" }}>
                <TextField
                  fullWidth
                  label="Classroom Name"
                  variant="standard"
                  value={description}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setDescription(event.target.value)
                  }
                />
              </Box>

              <Box sx={{ gridColumn: "span 3" }}>
                <Typography mb={1}>Lunch Times</Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  <TimeSelector
                    label="Monday"
                    time={mondayLunchTime}
                    availTimes={schoolYear.lunchTimes
                      .filter((lt) => lt.dayOfWeek === DayOfWeek.MONDAY)
                      .map((lt) => lt.time)}
                    onTimeChanged={setMondayLunchTime}
                    wrapInFormControl={true}
                  />
                  <TimeSelector
                    label="Tuesday"
                    time={tuesdayLunchTime}
                    availTimes={schoolYear.lunchTimes
                      .filter((lt) => lt.dayOfWeek === DayOfWeek.TUESDAY)
                      .map((lt) => lt.time)}
                    onTimeChanged={setTuesdayLunchTime}
                    wrapInFormControl={true}
                  />
                  <TimeSelector
                    label="Wednesday"
                    time={wednesdayLunchTime}
                    availTimes={schoolYear.lunchTimes
                      .filter((lt) => lt.dayOfWeek === DayOfWeek.WEDNESDAY)
                      .map((lt) => lt.time)}
                    onTimeChanged={setWednesdayLunchTime}
                    wrapInFormControl={true}
                  />
                  <TimeSelector
                    label="Thursday"
                    time={thursdayLunchTime}
                    availTimes={schoolYear.lunchTimes
                      .filter((lt) => lt.dayOfWeek === DayOfWeek.THURSDAY)
                      .map((lt) => lt.time)}
                    onTimeChanged={setThursdayLunchTime}
                    wrapInFormControl={true}
                  />
                  <TimeSelector
                    label="Friday"
                    time={fridayLunchTime}
                    availTimes={schoolYear.lunchTimes
                      .filter((lt) => lt.dayOfWeek === DayOfWeek.FRIDAY)
                      .map((lt) => lt.time)}
                    onTimeChanged={setFridayLunchTime}
                    wrapInFormControl={true}
                  />
                </Box>
              </Box>
            </>
          ) : (
            <></>
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
