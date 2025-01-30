import React, { useContext, useEffect, useState } from "react";
import "./App.css";
import { Box, Button, IconButton, Paper, Typography } from "@mui/material";
import { AppContext } from "./AppContextProvider";
import { Role } from "./models/User";
import { Notification } from "./models/Notification";
import { Delete, Edit, Grade } from "@mui/icons-material";
import { DateTimeUtils, DateTimeFormat } from "./DateTimeUtils";
import { green } from "@mui/material/colors";
import EditNotificationDialog from "./components/EditNotificationDialog";
import { deleteNotification, updateNotificationReviewDate } from "./services/AdminClientServices";

const NotificationsList: React.FC<{
  title?: string;
  notifications: Notification[];
  onDelete: (notification: Notification) => void;
  onEdit: (notification: Notification) => void;
}> = ({ title, notifications, onDelete, onEdit }) => {
  const { user } = useContext(AppContext);

  useEffect(() => {
    updateNotificationReviewDate();
  }, [])

  if (!notifications.length) {
    return <></>;
  }

  const sortedNotifications = [...notifications].sort(
    (n1, n2) =>
      (n1.startDate.localeCompare(n2.startDate) ||
      n1.endDate.localeCompare(n2.endDate) ||
      (n1.id - n2.id)) * -1
  );


  return (
    <>
      {title ? <Typography variant="h5">{title}</Typography> : <></>}
      {sortedNotifications.map((notification) => (
        <Paper
          key={notification.id}
          sx={{ display: "grid", gridTemplateColumns: "1fr auto auto", p: 2 }}
        >
          <Box
            sx={{
              mb: 1,
              gridColumn: user.role !== Role.ADMIN ? "span 2" : undefined,
              display: 'flex',
              flexDirection: "row",
              alignItems: 'center',
            }}
          >
            {user.role !== Role.ADMIN &&
            new Date(user.notificationReviewDate) <
              new Date(notification.creationDate) ? (
              <Grade sx={{ color: green[300] }} />
            ) : (
              <></>
            )}
            <Typography fontWeight="bold">
              {user.role !== Role.ADMIN
                ? "Posted: " +
                  DateTimeUtils.toString(
                    notification.startDate,
                    DateTimeFormat.SHORT_DAY_OF_WEEK_DESC
                  )
                : "Post Dates: " +
                  DateTimeUtils.toString(
                    notification.startDate,
                    DateTimeFormat.SHORT_DAY_OF_WEEK_DESC
                  ) +
                  " - " +
                  DateTimeUtils.toString(
                    notification.endDate,
                    DateTimeFormat.SHORT_DAY_OF_WEEK_DESC
                  )}
            </Typography>
          </Box>
          {user.role === Role.ADMIN ? (
            <>
              <IconButton
                color="primary"
                onClick={() => onEdit(notification)}
                size="small"
              >
                <Edit />
              </IconButton>
              <IconButton
                color="primary"
                onClick={() => onDelete(notification)}
                size="small"
              >
                <Delete />
              </IconButton>
            </>
          ) : (
            <></>
          )}

          <Typography
            sx={{
              gridColumn: user.role !== Role.ADMIN ? "span 2" : undefined,
            }}
          >
            {notification.msg}
          </Typography>
        </Paper>
      ))}
    </>
  );
};

const NotificationsPage: React.FC = () => {
  const { user, notifications, setNotifications } = useContext(AppContext);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [notificationToEdit, setNotificationToEdit] = useState<Notification>();

  const today = DateTimeUtils.toString(new Date());

  const handleEditNotification = (notification: Notification) => {
    setNotificationToEdit(notification);
    setShowNotificationDialog(true);
  };

  const handleCloseDialog = () => {
    setNotificationToEdit(undefined);
    setShowNotificationDialog(false);
  };

  const handleDeleteNotification = async (notification: Notification) => {
    await deleteNotification(notification.id);
    setNotifications(
      notifications.filter((item) => item.id !== notification.id)
    );
  };

  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h5" sx={{ textAlign: "center" }}>
        Notifications
      </Typography>
      <Box
        sx={{
          display: user.role !== Role.ADMIN ? "flex" : undefined,
          alignItems: "center",
          gap: 1,
        }}
      >
        {user.role !== Role.ADMIN ? (
          <>
            <Grade sx={{ color: green[300] }} />
            <Typography textAlign={"left"}>New Notifications</Typography>
          </>
        ) : (
          <Button
            variant="contained"
            onClick={() => setShowNotificationDialog(true)}
          >
            Add A Notification
          </Button>
        )}
      </Box>
      {user.role !== Role.ADMIN ? (
        <NotificationsList
          onDelete={handleDeleteNotification}
          onEdit={handleEditNotification}
          notifications={notifications.filter(
            (notification) =>
              notification.startDate <= today && notification.endDate >= today
          )}
        />
      ) : (
        <>
          <NotificationsList
            title={"Current Notifications"}
            onDelete={handleDeleteNotification}
            onEdit={handleEditNotification}
            notifications={notifications.filter(
              (notification) =>
                notification.startDate <= today && notification.endDate >= today
            )}
          />
          <NotificationsList
            title={"Upcoming Notifications"}
            onDelete={handleDeleteNotification}
            onEdit={handleEditNotification}
            notifications={notifications.filter(
              (notification) => notification.startDate > today
            )}
          />
          <NotificationsList
            title={"Expired Notifications"}
            onDelete={handleDeleteNotification}
            onEdit={handleEditNotification}
            notifications={notifications.filter(
              (notification) => notification.endDate < today
            )}
          />
        </>
      )}
      {showNotificationDialog ? (
        <EditNotificationDialog
          notification={notificationToEdit}
          onClose={handleCloseDialog}
        />
      ) : (
        <></>
      )}
    </Box>
  );
};

export default NotificationsPage;
