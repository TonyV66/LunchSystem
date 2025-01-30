import React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { Breakpoint } from "@mui/material";
interface ConfirmDialogProps {
  title?: string;
  open: boolean;
  onOk: () => void;
  onCancel: () => void;
  okLabel?: string;
  isOkDisabled?: boolean;
  hideCancelButton?: boolean;
  cancelLabel?: string;
  maxWidth?: false | Breakpoint;
  children: React.ReactNode;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = (props) => {
  return (
    <Dialog
      maxWidth={props.maxWidth}
      open={props.open}
      onClose={() => props.onCancel()}
      aria-labelledby="confirm-dialog"
    >
      {props.title ? (
        <DialogTitle id="confirm-dialog">{props.title}</DialogTitle>
      ) : (
        <></>
      )}
      <DialogContent>{props.children}</DialogContent>
      <DialogActions>
        {!props.hideCancelButton && (
          <Button
            variant="contained"
            onClick={() => props.onCancel()}
            color="primary"
          >
            {props.cancelLabel ? props.cancelLabel : "Cancel"}
          </Button>
        )}
        <Button
          variant="contained"
          color="primary"
          disabled={props.isOkDisabled}
          onClick={() => {
            props.onOk();
          }}
        >
          {props.okLabel ? props.okLabel : "OK"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default ConfirmDialog;
