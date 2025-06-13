import React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  AppBar,
  Box,
  Dialog,
  IconButton,
  Slide,
  Toolbar,
  Typography,
} from "@mui/material";
import { Close, ExpandMore, Print } from "@mui/icons-material";

import { TransitionProps } from "@mui/material/transitions";
import { useReactToPrint } from "react-to-print";
import { AppContext } from "../../AppContextProvider";
import { DateTimeUtils, DateTimeFormat } from "../../DateTimeUtils";
import User, { Role } from "../../models/User";
import ClassroomMealReport from "./ClassroomMealReport";
import TeacherLunchTime from "../../models/TeacherLunchTime";

const getMealTime = (teacher: User, teacherLunchTimes: TeacherLunchTime[], date: Date) => {
  const dayOfWeek = DateTimeUtils.toDate(date).getDay();
  const mealTime =
    teacherLunchTimes.find((lunchTime) => lunchTime.teacherId === teacher.id && lunchTime.dayOfWeek === dayOfWeek)
      ?.times[0] ?? "12:00";
  return DateTimeUtils.toTwelveHourTime(mealTime);
};

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<unknown>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface DialogProps {
  date: string;
  teacherId?: number;
  onClose: () => void;
}

const ClassroomMealsDialog: React.FC<DialogProps> = ({
  teacherId,
  date,
  onClose,
}) => {
  const dayOfWeek = DateTimeUtils.toDate(date).getDay();
  const { students, orders, users, currentSchoolYear } = React.useContext(AppContext);

  const reportRef = React.useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: reportRef,
  });

  const studentLunchTimes = currentSchoolYear.studentLunchTimes;

  const sortedTeachers = users
    .filter((user) => user.role === Role.TEACHER)
    .sort((t1, t2) =>
      t1.name.toLowerCase().localeCompare(t2.name.toLowerCase())
    );

  function handleClick(
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ): void {
    event.stopPropagation();
    handlePrint();
  }

  return (
    <Dialog
      open={true}
      fullScreen
      onClose={onClose}
      TransitionComponent={Transition}
    >
      <AppBar sx={{ position: "relative" }}>
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
            Classroom Report
          </Typography>
          <IconButton
            onClick={handleClick}
            size="small"
            sx={{ color: "white" }}
          >
            <Print />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box ref={reportRef} p={2} overflow="visible">
        <Typography variant="h6" mb={1} fontWeight={"bold"}>
          {DateTimeUtils.toString(date, DateTimeFormat.SHORT_DAY_OF_WEEK_DESC)}
        </Typography>
        {teacherId ? (
          <ClassroomMealReport teacherId={teacherId} date={date} />
        ) : (
          sortedTeachers.map((teacher) => {
            const studentIds = students
              .filter((student) =>
                studentLunchTimes.find(
                  (lt) =>
                    lt.studentId === student.id && lt.dayOfWeek === dayOfWeek && lt.teacherId === teacher.id
                )
                  ? true
                  : false
              )
              .map((student) => student.id);
            if (!orders
              .flatMap((order) => order.meals)
              .find(
                (m) => (m.staffMemberId === teacher.id) || (m.studentId && studentIds.includes(m.studentId)) && m.date === date
              )) {
              return <></>;
            }
            return (
              <Accordion elevation={3} key={teacher.id}>
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  aria-controls="panel1-content"
                  id="panel1-header"
                >
                  <Typography fontWeight="bold">
                    {teacher.name +
                      (teacher.description ? " - " + teacher.description : "") +
                      " @" +
                      getMealTime(teacher, currentSchoolYear.teacherLunchTimes, DateTimeUtils.toDate(date))}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <ClassroomMealReport teacherId={teacher.id} date={date} />
                </AccordionDetails>
              </Accordion>
            );
          })
        )}
      </Box>
    </Dialog>
  );
};

export default ClassroomMealsDialog;
