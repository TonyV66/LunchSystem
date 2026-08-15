import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem as MuiMenuItem,
  Box,
  SelectChangeEvent,
} from "@mui/material";
import { DateRange, Range } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { ReportType } from "../../models/ReportType";
import PrintableCohortsReport from "./PrintableCohortsReport";
import { useReactToPrint } from "react-to-print";
import { DateTimeUtils, DaysOfWeek } from "../../DateTimeUtils";
import PrintableDailySummary from "./PrintableDailySummary";
import SchoolYear from "../../models/SchoolYear";
import PrintableLunchPeriodReport from "./PrintableLunchPeriodReport";
import { AppContext } from "../../AppContextProvider";
import PrintableShoppingList from "./PrintableShoppingList";

interface PrintReportDialogProps {
  open: boolean;
  onClose: () => void;
}

const PrintReportDialog: React.FC<PrintReportDialogProps> = ({
  open,
  onClose,
}) => {
  const { currentSchoolYear } = React.useContext(AppContext);
  const [selectedReportType, setSelectedReportType] =
    React.useState<ReportType>(ReportType.DAILY_SUMMARY);
  const [dateRange, setDateRange] = React.useState<Range[]>([
    {
      startDate: DateTimeUtils.getCurrentDate(),
      endDate: DateTimeUtils.getCurrentDate(),
      key: "selection",
    },
  ]);
  const reportRef = React.useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef: reportRef });

  const handleReportTypeChange = (event: SelectChangeEvent<ReportType>) => {
    setSelectedReportType(event.target.value as ReportType);
  };

  const handlePrint = () => {
    reactToPrintFn();
  };

  const handleCancel = () => {
    onClose();
  };

  const printDisabled = !dateRange[0].startDate || !dateRange[0].endDate;
  const dates: string[] = [];

  const startDate = dateRange[0].startDate
    ? DateTimeUtils.toString(dateRange[0].startDate)
    : "";
  const endDate = dateRange[0].endDate
    ? DateTimeUtils.toString(dateRange[0].endDate)
    : "";

  if (startDate && endDate) {
    for (
      let date = startDate;
      date <= endDate;
      date = DateTimeUtils.toString(DateTimeUtils.addDays(date, 1))
    ) {
      if (DateTimeUtils.dateFallsOnDayOfWeek(date, DaysOfWeek.WEEKDAYS)) {
        dates.push(date);
      }
    }
  }

  const reportTypeOrder = [
    ReportType.DAILY_SUMMARY,
    ReportType.MEALS_PER_LUNCH_PERIOD,
    ReportType.DAILY_COHORT_MEALS,
    ReportType.SHOPPING_LIST,
  ];

  const getLunchPeriods = (currentSchoolYear: SchoolYear, date: string) => {
    const dayOfWeek = DateTimeUtils.toDate(date).getDay();
    const dailyTimes = currentSchoolYear.lunchTimes.find(
      (lt) => lt.dayOfWeek === dayOfWeek
    );
    return dailyTimes?.times.sort() ?? [];
  };

  let reports: JSX.Element[] = [];
  if (selectedReportType === ReportType.DAILY_COHORT_MEALS) {
    reports = dates.map((date) => (
      <PrintableCohortsReport key={date} date={date} />
    ));
  } else if (selectedReportType === ReportType.DAILY_SUMMARY) {
    reports = dates.map((date) => (
      <PrintableDailySummary key={date} date={date} />
    ));
  } else if (selectedReportType === ReportType.MEALS_PER_LUNCH_PERIOD) {
    dates.forEach((date) => {
      getLunchPeriods(currentSchoolYear, date).forEach((time) =>
        reports.push(
          <PrintableLunchPeriodReport
            key={date + "-" + time}
            date={date}
            time={time}
          />
        )
      );
      reports.push(<PrintableLunchPeriodReport key={date} date={date} />);
    });
  } else if (selectedReportType === ReportType.SHOPPING_LIST) {
    reports.push(<PrintableShoppingList key={startDate + "-" + endDate} startDate={startDate} endDate={endDate} />);
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm">
        <DialogTitle>Print Report</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="report-type-label">Report Type</InputLabel>
              <Select
                labelId="report-type-label"
                value={selectedReportType}
                variant="standard"
                label="Report Type"
                onChange={handleReportTypeChange}
              >
                {reportTypeOrder.map((reportType) => (
                  <MuiMenuItem key={reportType} value={reportType}>
                    {reportType}
                  </MuiMenuItem>
                ))}
              </Select>
            </FormControl>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                border: "1px solid",
                borderRadius: 1,
                borderColor: "divider",
              }}
            >
              <DateRange
                editableDateInputs={false}
                onChange={(item) => setDateRange([item.selection])}
                moveRangeOnFirstSelection={false}
                ranges={dateRange}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Close</Button>
          <Button
            onClick={handlePrint}
            variant="contained"
            disabled={printDisabled}
          >
            Print
          </Button>
        </DialogActions>
      </Dialog>
      <Box display="none">
        <Box ref={reportRef}>
          {reports}
        </Box>
      </Box>
    </>
  );
};

export default PrintReportDialog;
