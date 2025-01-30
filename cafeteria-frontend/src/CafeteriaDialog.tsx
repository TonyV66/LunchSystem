import React from "react";
import "./App.css";
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
import CafeteriaReport from "./components/CafeteriaReport";
import { useReactToPrint } from "react-to-print";

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
  const reportRef = React.useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: reportRef,
  });

  function handleClick(
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ): void {
    event.stopPropagation();
    handlePrint();
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
              Cafeteria Report
            </Typography>
            <IconButton
              onClick={handleClick}
              size="small"
              sx={{color: 'white'}}
            >
              <Print />
            </IconButton>
          </Toolbar>
        </AppBar>
        <CafeteriaReport ref={reportRef} date={date} />
    </Dialog>
  );
};

export default CafeteriaDialog;
