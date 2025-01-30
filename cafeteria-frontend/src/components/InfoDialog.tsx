import React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";

interface DialogProps {
  msg: string;
  onOk: () => void;
}

const InfoDialog: React.FC<DialogProps> = (props) => {
  const { msg, onOk } = props;

  return (
    <Dialog
      open={msg ? true : false}
      onClose={onOk}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {msg}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onOk}>OK</Button>
      </DialogActions>
    </Dialog>
  );
};

export default InfoDialog;
