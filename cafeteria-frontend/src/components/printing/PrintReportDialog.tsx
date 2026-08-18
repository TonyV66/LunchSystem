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
  Stack,
  Typography,
  Checkbox,
} from "@mui/material";
import { DragIndicator } from "@mui/icons-material";
import { DateRange, Range } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { ReportType } from "../../models/ReportType";
import PrintableCohortsReport, {
  CohortGroup,
  getAvailableCohortGroups,
} from "./PrintableCohortsReport";
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

const listBoxSx = {
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 1,
  height: 160,
  overflow: "auto",
  flex: 1,
  minWidth: 0,
};

const GRADE_OPTION_WIDTH = "4rem";
const TEACHER_OPTION_WIDTH = "8rem";

const getDefaultPrintDate = (): Date => {
  let date = DateTimeUtils.toDate(DateTimeUtils.getCurrentDate());
  while (DateTimeUtils.dateFallsOnDayOfWeek(date, DaysOfWeek.WEEKENDS)) {
    date = DateTimeUtils.addDays(date, 1);
  }
  return date;
};

const PrintReportDialog: React.FC<PrintReportDialogProps> = ({
  open,
  onClose,
}) => {
  const { currentSchoolYear, users } = React.useContext(AppContext);
  const [selectedReportType, setSelectedReportType] =
    React.useState<ReportType>(ReportType.DAILY_SUMMARY);
  const [dateRange, setDateRange] = React.useState<Range[]>([
    {
      startDate: getDefaultPrintDate(),
      endDate: getDefaultPrintDate(),
      key: "selection",
    },
  ]);
  const [selectedCohorts, setSelectedCohorts] = React.useState<CohortGroup[]>(
    [],
  );
  const [dropIndex, setDropIndex] = React.useState<number | null>(null);
  const dragIndexRef = React.useRef<number | null>(null);
  const reportRef = React.useRef<HTMLDivElement>(null);
  const calendarBoxRef = React.useRef<HTMLDivElement>(null);
  const [calendarHeight, setCalendarHeight] = React.useState<number | null>(
    null,
  );
  const printOptions = React.useMemo(() => ({ contentRef: reportRef }), []);
  const reactToPrintFn = useReactToPrint(printOptions);
  const [printTick, setPrintTick] = React.useState(0);

  const availableCohorts = React.useMemo(
    () => getAvailableCohortGroups(currentSchoolYear, users),
    [currentSchoolYear, users],
  );
  const gradeCohorts = availableCohorts.filter(
    (cohort) => cohort.kind === "grade",
  );
  const teacherCohorts = availableCohorts.filter(
    (cohort) => cohort.kind === "teacher",
  );
  const staffCohort = availableCohorts.find(
    (cohort) => cohort.kind === "staff",
  );
  const unassignedCohort = availableCohorts.find(
    (cohort) => cohort.kind === "unassigned",
  );

  const getItemsForGrade = (grade: CohortGroup): CohortGroup[] => {
    if (grade.kind === "grade" && grade.selectsTeachers && grade.grade) {
      return availableCohorts.filter(
        (item) =>
          item.kind === "teacher" && item.grades?.includes(grade.grade!),
      );
    }
    return [grade];
  };

  const getItemsForGrades = (grades: CohortGroup[]): CohortGroup[] => {
    const items: CohortGroup[] = [];
    const seen = new Set<string>();
    for (const grade of grades) {
      for (const item of getItemsForGrade(grade)) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          items.push(item);
        }
      }
    }
    return items;
  };

  const handleToggleCohort = (cohort: CohortGroup, checked: boolean) => {
    const items =
      cohort.kind === "grade" && cohort.selectsTeachers
        ? getItemsForGrade(cohort)
        : [cohort];
    const itemIds = new Set(items.map((item) => item.id));
    if (checked) {
      const toAdd = items.filter(
        (item) => !selectedCohorts.some((selected) => selected.id === item.id),
      );
      setSelectedCohorts(selectedCohorts.concat(toAdd));
    } else {
      setSelectedCohorts(
        selectedCohorts.filter((selected) => !itemIds.has(selected.id)),
      );
    }
  };

  const getAllGradesRowItems = () => {
    const items = getItemsForGrades(gradeCohorts);
    if (unassignedCohort) {
      items.push(unassignedCohort);
    }
    return items;
  };

  const handleToggleAllGrades = (checked: boolean) => {
    const allItems = getAllGradesRowItems();
    const allItemIds = new Set(allItems.map((item) => item.id));
    if (checked) {
      const toAdd = allItems.filter(
        (item) => !selectedCohorts.some((selected) => selected.id === item.id),
      );
      setSelectedCohorts(selectedCohorts.concat(toAdd));
    } else {
      setSelectedCohorts(
        selectedCohorts.filter((selected) => !allItemIds.has(selected.id)),
      );
    }
  };

  React.useEffect(() => {
    if (!open) {
      return;
    }
    const defaultDate = getDefaultPrintDate();
    setDateRange([
      {
        startDate: defaultDate,
        endDate: defaultDate,
        key: "selection",
      },
    ]);
  }, [open]);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    const grades = availableCohorts.filter((cohort) => cohort.kind === "grade");
    const unassigned = availableCohorts.find(
      (cohort) => cohort.kind === "unassigned",
    );
    const staff = availableCohorts.find((cohort) => cohort.kind === "staff");
    const items = getItemsForGrades(grades);
    if (unassigned) {
      items.push(unassigned);
    }
    if (staff) {
      items.push(staff);
    }
    setSelectedCohorts(items);
  }, [open, availableCohorts]);

  React.useLayoutEffect(() => {
    if (!open || selectedReportType !== ReportType.DAILY_COHORT_MEALS) {
      return;
    }
    const node = calendarBoxRef.current;
    if (!node) {
      return;
    }
    const updateHeight = () => {
      setCalendarHeight(node.getBoundingClientRect().height);
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, [open, selectedReportType]);

  const handleReportTypeChange = (event: SelectChangeEvent<ReportType>) => {
    setSelectedReportType(event.target.value as ReportType);
  };

  const getCohortCheckboxState = (cohort: CohortGroup) => {
    if (cohort.kind === "grade" && cohort.selectsTeachers) {
      const teachersForGrade = getItemsForGrade(cohort);
      const selectedCount = teachersForGrade.filter((teacher) =>
        selectedCohorts.some((selected) => selected.id === teacher.id),
      ).length;
      return {
        checked:
          teachersForGrade.length > 0 &&
          selectedCount === teachersForGrade.length,
        indeterminate:
          selectedCount > 0 && selectedCount < teachersForGrade.length,
      };
    }

    return {
      checked: selectedCohorts.some((selected) => selected.id === cohort.id),
      indeterminate: false,
    };
  };

  const getAllGradesCheckboxState = () => {
    const selectable = unassignedCohort
      ? gradeCohorts.concat(unassignedCohort)
      : gradeCohorts;
    if (selectable.length === 0) {
      return { checked: false, indeterminate: false };
    }
    let fullySelected = 0;
    let anySelected = 0;
    for (const cohort of selectable) {
      const state = getCohortCheckboxState(cohort);
      if (state.checked) {
        fullySelected++;
      }
      if (state.checked || state.indeterminate) {
        anySelected++;
      }
    }
    return {
      checked: fullySelected === selectable.length,
      indeterminate: anySelected > 0 && fullySelected < selectable.length,
    };
  };

  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    dragIndexRef.current = index;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (
    event: React.DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropIndex(index);
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    event.preventDefault();
    const fromIndex = dragIndexRef.current;
    dragIndexRef.current = null;
    setDropIndex(null);
    if (fromIndex === null || fromIndex === index) {
      return;
    }
    const updated = selectedCohorts.slice();
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(index, 0, moved);
    setSelectedCohorts(updated);
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDropIndex(null);
  };

  const handlePrint = () => {
    setPrintTick((tick) => tick + 1);
  };

  React.useEffect(() => {
    if (printTick === 0) {
      return;
    }
    reactToPrintFn();
  }, [printTick, reactToPrintFn]);

  const handleCancel = () => {
    onClose();
  };

  const renderAllGradesOption = () => {
    const { checked, indeterminate } = getAllGradesCheckboxState();
    return (
      <Box
        component="label"
        title="All grades and unassigned students"
        sx={{
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          width: GRADE_OPTION_WIDTH,
          flex: `0 0 ${GRADE_OPTION_WIDTH}`,
        }}
      >
        <Checkbox
          size="small"
          checked={checked}
          indeterminate={indeterminate}
          tabIndex={-1}
          disableRipple
          sx={{ p: 0.25 }}
          onChange={(event) => handleToggleAllGrades(event.target.checked)}
          inputProps={{
            "aria-label": "Select all grades and unassigned students",
          }}
        />
        <Typography variant="caption" noWrap sx={{ minWidth: 0, flex: 1 }}>
          All
        </Typography>
      </Box>
    );
  };

  const renderCohortOption = (cohort: CohortGroup, width?: string) => {
    const { checked, indeterminate } = getCohortCheckboxState(cohort);
    return (
      <Box
        key={cohort.id}
        component="label"
        title={cohort.label}
        sx={{
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          minWidth: 0,
          overflow: "hidden",
          ...(width ? { width, flex: `0 0 ${width}` } : { pr: 1 }),
        }}
      >
        <Checkbox
          size="small"
          checked={checked}
          indeterminate={indeterminate}
          tabIndex={-1}
          disableRipple
          sx={{ p: 0.25 }}
          onChange={(event) => handleToggleCohort(cohort, event.target.checked)}
          inputProps={{
            "aria-label": `Select ${cohort.label}`,
          }}
        />
        <Typography variant="caption" noWrap sx={{ minWidth: 0, flex: 1 }}>
          {cohort.label}
        </Typography>
      </Box>
    );
  };

  const startDate = dateRange[0].startDate
    ? DateTimeUtils.toString(dateRange[0].startDate)
    : "";
  const endDate = dateRange[0].endDate
    ? DateTimeUtils.toString(dateRange[0].endDate)
    : "";

  const dates: string[] = [];
  if (startDate && endDate) {
    const isSingleDay = startDate === endDate;
    for (
      let date = startDate;
      date <= endDate;
      date = DateTimeUtils.toString(DateTimeUtils.addDays(date, 1))
    ) {
      if (
        isSingleDay ||
        DateTimeUtils.dateFallsOnDayOfWeek(date, DaysOfWeek.WEEKDAYS)
      ) {
        dates.push(date);
      }
    }
  }

  const printDisabled =
    !dateRange[0].startDate ||
    !dateRange[0].endDate ||
    dates.length === 0 ||
    (selectedReportType === ReportType.DAILY_COHORT_MEALS &&
      selectedCohorts.length === 0);

  const reportTypeOrder = [
    ReportType.DAILY_SUMMARY,
    ReportType.MEALS_PER_LUNCH_PERIOD,
    ReportType.DAILY_COHORT_MEALS,
    ReportType.SHOPPING_LIST,
  ];

  const getLunchPeriods = (currentSchoolYear: SchoolYear, date: string) => {
    const dayOfWeek = DateTimeUtils.toDate(date).getDay();
    const dailyTimes = currentSchoolYear.lunchTimes.find(
      (lt) => lt.dayOfWeek === dayOfWeek,
    );
    return dailyTimes?.times.sort() ?? [];
  };

  let reports: JSX.Element[] = [];
  if (selectedReportType === ReportType.DAILY_COHORT_MEALS) {
    reports = dates.map((date) => (
      <PrintableCohortsReport
        key={date}
        date={date}
        cohorts={selectedCohorts}
      />
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
          />,
        ),
      );
      reports.push(<PrintableLunchPeriodReport key={date} date={date} />);
    });
  } else if (selectedReportType === ReportType.SHOPPING_LIST) {
    reports.push(
      <PrintableShoppingList
        key={startDate + "-" + endDate}
        startDate={startDate}
        endDate={endDate}
      />,
    );
  }

  const dateRangePicker = (
    <DateRange
      editableDateInputs={false}
      onChange={(item) => {
        const selection = item.selection;
        setDateRange([
          {
            startDate: selection?.startDate
              ? new Date(selection.startDate.getTime())
              : undefined,
            endDate: selection?.endDate
              ? new Date(selection.endDate.getTime())
              : undefined,
            key: "selection",
          },
        ]);
      }}
      moveRangeOnFirstSelection={false}
      ranges={dateRange}
    />
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth={
          selectedReportType === ReportType.DAILY_COHORT_MEALS ? "md" : "sm"
        }
        fullWidth={selectedReportType === ReportType.DAILY_COHORT_MEALS}
      >
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

            {selectedReportType === ReportType.DAILY_COHORT_MEALS ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.5,
                }}
              >
                <Box
                  ref={calendarBoxRef}
                  sx={{
                    display: "inline-flex",
                    flexShrink: 0,
                    height: "fit-content",
                    border: "1px solid",
                    borderRadius: 1,
                    borderColor: "divider",
                    overflow: "hidden",
                    "& .rdrDateRangeWrapper, & .rdrCalendarWrapper": {
                      display: "inline-flex",
                      flexDirection: "column",
                    },
                  }}
                >
                  {dateRangePicker}
                </Box>
                <Stack
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    height: calendarHeight ?? "auto",
                    overflow: "hidden",
                  }}
                  gap={1.5}
                >
                  <Stack sx={{ flex: 1, minHeight: 0 }} gap={0.25}>
                    <Typography variant="caption" fontWeight="bold">
                      Select Desired Reports
                    </Typography>
                    <Box
                      sx={{
                        ...listBoxSx,
                        height: 0,
                        flex: 1,
                        minHeight: 0,
                      }}
                    >
                      {availableCohorts.length === 0 ? (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ px: 1, py: 0.5, display: "block" }}
                        >
                          No groupings available.
                        </Typography>
                      ) : (
                        <Stack useFlexGap sx={{ px: 0.5, py: 0.25 }}>
                          {(gradeCohorts.length > 0 || unassignedCohort) && (
                            <>
                              <Typography variant="caption" fontWeight="bold">
                                Grades
                              </Typography>
                              <Stack direction="row" flexWrap="wrap">
                                {(gradeCohorts.length > 0 ||
                                  unassignedCohort) &&
                                  renderAllGradesOption()}
                                {gradeCohorts.map((cohort) =>
                                  renderCohortOption(
                                    cohort,
                                    GRADE_OPTION_WIDTH,
                                  ),
                                )}
                                {unassignedCohort &&
                                  renderCohortOption(unassignedCohort)}
                              </Stack>
                            </>
                          )}
                          {(teacherCohorts.length > 0 || staffCohort) && (
                            <>
                              <Typography variant="caption" fontWeight="bold">
                                Classrooms & Staff
                              </Typography>
                              <Stack direction="row" flexWrap="wrap">
                                {staffCohort &&
                                  renderCohortOption(
                                    staffCohort,
                                    TEACHER_OPTION_WIDTH,
                                  )}
                                {teacherCohorts.map((cohort) =>
                                  renderCohortOption(
                                    cohort,
                                    TEACHER_OPTION_WIDTH,
                                  ),
                                )}
                              </Stack>
                            </>
                          )}
                        </Stack>
                      )}
                    </Box>
                  </Stack>
                  <Stack sx={{ flex: 1, minHeight: 0 }} gap={0.25}>
                    <Typography variant="caption" fontWeight="bold">
                      Drag & Drop Print Order
                    </Typography>
                    <Box
                      sx={{
                        ...listBoxSx,
                        height: 0,
                        flex: 1,
                        minHeight: 0,
                      }}
                      onDragOver={(event) => {
                        if (selectedCohorts.length === 0) {
                          event.preventDefault();
                        }
                      }}
                    >
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                          px: 0.5,
                        }}
                      >
                        {selectedCohorts.map((cohort, index) => (
                          <Box
                            key={cohort.id}
                            draggable
                            title={cohort.label}
                            onDragStart={(event) =>
                              handleDragStart(event, index)
                            }
                            onDragOver={(event) => handleDragOver(event, index)}
                            onDrop={(event) => handleDrop(event, index)}
                            onDragEnd={handleDragEnd}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              minWidth: 0,
                              overflow: "hidden",
                              cursor: "grab",
                              minHeight: 28,
                              border:
                                dropIndex === index
                                  ? "2px solid"
                                  : "2px solid transparent",
                              borderColor:
                                dropIndex === index
                                  ? "primary.main"
                                  : "transparent",
                              borderRadius: 0.5,
                            }}
                          >
                            <DragIndicator
                              sx={{ fontSize: 16, flexShrink: 0 }}
                              color="action"
                            />
                            <Typography
                              variant="caption"
                              noWrap
                              sx={{ minWidth: 0, flex: 1 }}
                            >
                              {cohort.label}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Stack>
                </Stack>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignSelf: "center",
                  width: "fit-content",
                  border: "1px solid",
                  borderRadius: 1,
                  borderColor: "divider",
                }}
              >
                {dateRangePicker}
              </Box>
            )}
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
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          left: -10000,
          top: 0,
          width: "210mm",
        }}
      >
        <Box ref={reportRef}>
          <React.Fragment key={`${selectedReportType}:${dates.join(",")}`}>
            {reports}
          </React.Fragment>
        </Box>
      </Box>
    </>
  );
};

export default PrintReportDialog;
