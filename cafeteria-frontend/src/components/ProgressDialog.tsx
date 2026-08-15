import React from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";

interface ProgressDialogProps {
  open: boolean;
  title: string;
  message: string;
  isComplete: boolean;
  onOk: () => void;
}

const ProgressDialog: React.FC<ProgressDialogProps> = ({
  open,
  title,
  message,
  isComplete,
  onOk,
}) => {
  return (
    <Dialog
      open={open}
      maxWidth="xs"
      fullWidth
      disableEscapeKeyDown={!isComplete}
      onClose={(_, reason) => {
        if (!isComplete) {
          return;
        }
        if (reason === "backdropClick") {
          return;
        }
        onOk();
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack
          direction="row"
          spacing={2}
          alignItems="flex-start"
          sx={{ pt: 0.5 }}
        >
          {!isComplete && <CircularProgress size={24} sx={{ mt: 0.25 }} />}
          <Typography variant="body2">{message}</Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" disabled={!isComplete} onClick={onOk}>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProgressDialog;
