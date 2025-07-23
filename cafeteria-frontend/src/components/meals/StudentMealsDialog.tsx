import * as React from "react";
import {
  AppBar,
  Dialog,
  IconButton,
  Slide,
  Toolbar,
  Typography,
} from "@mui/material";
import { useContext } from "react";
import { AppContext } from "../../AppContextProvider";
import { DateTimeUtils } from "../../DateTimeUtils";
import { Close } from "@mui/icons-material";
import { Order } from "../../models/Order";
import OrderedMealsTable from "./OrderedMealsTable";
import { TransitionProps } from "@mui/material/transitions";
import Student from "../../models/Student";


const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<unknown>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export const StudentMealsDialog: React.FC<{
  student: Student;
  onClose: () => void;
}> = ({ student, onClose }) => {
  const {orders} = useContext(AppContext);
  const today = DateTimeUtils.toString(new Date());
  const order: Order = {
    id: 0,
    userId: 0,
    date: today,
    meals: orders.flatMap(order => order.meals).filter(meal => meal.studentId === student.id),
    taxes: 0,
    processingFee: 0,
    otherFees: 0
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
            Upcoming Meals - {student.firstName + " " + student.lastName}
          </Typography>
        </Toolbar>
      </AppBar>
      {<OrderedMealsTable student={student} order={order} hidePrice={true}/>}
    </Dialog>
  );
};

export default StudentMealsDialog;
