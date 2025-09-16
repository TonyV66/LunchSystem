import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { DateTimeFormat, DateTimeUtils } from "../../DateTimeUtils";
import PrintableCafeteriaReport from "../printing/PrintableCafeteriaReport";
import CafeteriaReport from "./CafeteriaReport";
import { useReactToPrint } from "react-to-print";

interface DialogProps {
  date: string;
  onClose: () => void;
}

const CafeteriaDialog: React.FC<DialogProps> = ({ date, onClose }) => {
  const reportRef = React.useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef: reportRef });

  return (
    <Dialog open={true} maxWidth="lg" onClose={() => {}}>
      <DialogTitle>
        Cafeteria Report -{" "}
        {DateTimeUtils.toString(date, DateTimeFormat.SHORT_DAY_OF_WEEK_DESC)}
      </DialogTitle>

      <DialogContent>
        <CafeteriaReport date={date} />
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={() => reactToPrintFn()}>
          Print
        </Button>
        <Button variant="contained" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
      <Box display="none">
        <Box ref={reportRef}>
          <PrintableCafeteriaReport date={date} />
        </Box>
      </Box>
    </Dialog>
  );
};

export default CafeteriaDialog;
