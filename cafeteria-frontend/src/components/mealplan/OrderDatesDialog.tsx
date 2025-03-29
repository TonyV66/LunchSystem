import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { DailyMenu } from "../../models/Menu";
import { DateTimeFormat, DateTimeUtils } from "../../DateTimeUtils";

interface DialogProps {
  menu: DailyMenu;
  onClose: () => void;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);

  return (
    DateTimeUtils.toString(date, DateTimeFormat.SHORT_DAY_OF_WEEK_DESC) +
    " @" +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
};

const OrderDatesDialog: React.FC<DialogProps> = ({ onClose, menu }) => {

  return (
    <Dialog
      open={true}
      onClose={() => onClose()}
      maxWidth="sm"
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle>Order Dates</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            pt: 1,
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: 2,
          }}
        >
          <Typography>Starting: </Typography>
          <Typography>{formatDate(menu.orderStartTime)}</Typography>
          <Typography>Ending: </Typography>
          <Typography>{formatDate(menu.orderEndTime)}</Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={() => onClose()}>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderDatesDialog;
