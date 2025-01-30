import React from "react";
import "./App.css";
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
import ClassroomMealReport from "./components/ClassroomMealReport";
import { DateTimeFormat, DateTimeUtils } from "./DateTimeUtils";
import { AppContext } from "./AppContextProvider";
import Meal from "./models/Meal";
import User, { Role } from "./models/User";

const getMealTime = (teacher: User, date: Date) => {
  let mealtime = "12:00";
  switch (date.getDay()) {
    case 1:
      mealtime = teacher.mondayLunchTime;
      break;
    case 2:
      mealtime = teacher.tuesdayLunchTime;
      break;
    case 3:
      mealtime = teacher.wednesdayLunchTime;
      break;
    case 4:
      mealtime = teacher.thursdayLunchTime;
      break;
    case 5:
      mealtime = teacher.fridayLunchTime;
      break;
  }
  return DateTimeUtils.toTwelveHourTime(mealtime);
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
  const { students, orders, users } = React.useContext(AppContext);

  const reportRef = React.useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: reportRef,
  });

  const sortedTeachers = users.filter(user => user.role === Role.TEACHER).sort((t1, t2) =>
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
      <Box ref={reportRef} p={2} overflow='visible'>
        <Typography variant="h6" mb={1} fontWeight={"bold"}>
          {DateTimeUtils.toString(date, DateTimeFormat.SHORT_DAY_OF_WEEK_DESC)}
        </Typography>
        {teacherId ? (
          <ClassroomMealReport teacherId={teacherId} date={date} />
        ) : (
          sortedTeachers.map((teacher) => {
            const studentIds = students
              .filter((student) => student.teacherId === teacher.id)
              .map((student) => student.id);
            const meals: Meal[] = orders
              .flatMap((order) => order.meals)
              .filter(
                (m) => studentIds.includes(m.studentId) && m.date === date
              );

            if (!meals.length) {
              return <></>;
            }
            return (
              <Accordion elevation={3} key={teacher.id}>
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  aria-controls="panel1-content"
                  id="panel1-header"
                >
                  <Typography fontWeight='bold'>
                  {teacher.name +
                    (teacher.description ? " - " + teacher.description : "") + " @" + getMealTime(teacher, DateTimeUtils.toDate(date))}
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
