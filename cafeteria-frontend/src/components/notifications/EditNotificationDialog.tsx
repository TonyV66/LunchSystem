import React, { useContext, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import { DateRange, Range } from "react-date-range";
import { Box, TextField, Typography } from "@mui/material";
import { grey } from "@mui/material/colors";
import { AppContext } from "../../AppContextProvider";
import { DateTimeUtils } from "../../DateTimeUtils";
import { Notification } from "../../models/Notification";
import {
  createNofication,
  updateNotification,
} from "../../api/CafeteriaClient";
import { AxiosError } from "axios";

interface DialogProps {
  notification?: Notification;
  onClose: () => void;
}

const EditNotificationDialog: React.FC<DialogProps> = ({
  notification,
  onClose,
}) => {
  const { notifications, setNotifications, setSnackbarErrorMsg } = useContext(AppContext);
  const [updatedNotification, setUpdatedNotification] = useState<Notification>(
    notification ?? {
      id: 0,
      msg: "",
      startDate: DateTimeUtils.toString(new Date()),
      endDate: DateTimeUtils.toString(new Date()),
      creationDate: new Date().toJSON(),
    }
  );

  const handleMsgChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUpdatedNotification({
      ...updatedNotification,
      msg: event.target.value,
    });
  };

  const handleDatesChanged = (dateRange: Range) => {
    setUpdatedNotification({
      ...updatedNotification,
      startDate: DateTimeUtils.toString(dateRange.startDate!),
      endDate: DateTimeUtils.toString(dateRange.endDate!),
    });
  };

  const handleSave = async () => {
    if (!updatedNotification.id) {
      try {
        const savedNotification = (await createNofication(
          updatedNotification
        )) as Notification;
        setNotifications(notifications.concat(savedNotification));
        onClose();
      } catch (error) {
        const axiosError = error as AxiosError;
        setSnackbarErrorMsg(
          "Error creating notification: " +
          (axiosError.response?.data?.toString() ?? axiosError.response?.statusText ?? "Unknown server error")
        );
      }
    } else {
      try {
        const savedNotification = (await updateNotification(
          updatedNotification
        )) as Notification;
        setNotifications(
          notifications.map((notification) =>
            notification.id !== savedNotification.id
              ? notification
              : savedNotification
          )
        );
        onClose();
      } catch (error) {
        const axiosError = error as AxiosError;
        setSnackbarErrorMsg(
          "Error updating notification: " +
          (axiosError.response?.data?.toString() ?? axiosError.response?.statusText ?? "Unknown server error")
        );
      }
    }
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogContent
        sx={{
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <TextField
          id="outlined-multiline-static"
          label="Notification Message"
          multiline
          onChange={handleMsgChanged}
          value={updatedNotification.msg}
          rows={4}
          sx={{ borderColor: grey[300] }}
        />
        <Box>
          <Typography variant="caption">Post Dates</Typography>
          <Box
            sx={{
              borderWidth: 1,
              borderColor: grey[300],
              borderStyle: "solid",
            }}
          >
            <DateRange
              editableDateInputs={false}
              onChange={(item) => handleDatesChanged(item.selection)}
              moveRangeOnFirstSelection={false}
              ranges={[
                {
                  startDate: DateTimeUtils.toDate(
                    updatedNotification.startDate
                  ),
                  endDate: DateTimeUtils.toDate(updatedNotification.endDate),
                  key: "selection",
                },
              ]}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          disabled={!updatedNotification.msg.trim().length}
          onClick={handleSave}
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditNotificationDialog;
