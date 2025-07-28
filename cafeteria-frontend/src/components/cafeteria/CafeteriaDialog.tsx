import React from "react";
import {
  AppBar,
  Dialog,
  IconButton,
  Slide,
  Toolbar,
  Typography,
} from "@mui/material";
import { Close, Print } from "@mui/icons-material";

import { TransitionProps } from '@mui/material/transitions';
import CafeteriaReport from "./CafeteriaReport";
import { DateTimeFormat, DateTimeUtils } from "../../DateTimeUtils";
import { showDailyCafeteriaReport } from "../../api/CafeteriaClient";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<unknown>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});


interface DialogProps {
  date: string;
  onClose: () => void;
}

const CafeteriaDialog: React.FC<DialogProps> = ({ date, onClose }) => {
  function handlePrintClick(
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ): void {
    event.stopPropagation();
    showDailyCafeteriaReport(date);
  }

  console.log(date);
  return (
    <Dialog
      open={true}
      fullScreen
      onClose={onClose}
      TransitionComponent={Transition}
  >
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={onClose}
              aria-label="close"
            >
              <Close />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              Cafeteria Report - {DateTimeUtils.toString(date, DateTimeFormat.SHORT_DAY_OF_WEEK_DESC)}
            </Typography>
            <IconButton
              onClick={handlePrintClick}
              size="small"
              sx={{color: 'white'}}
            >
              <Print />
            </IconButton>
          </Toolbar>
        </AppBar>
        <CafeteriaReport date={date} />

    </Dialog>
  );
};

export default CafeteriaDialog;
