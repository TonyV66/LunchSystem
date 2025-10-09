import * as React from "react";
import {
  AppBar,
  Dialog,
  IconButton,
  Slide,
  Toolbar,
  Typography,
} from "@mui/material";
import { DateTimeUtils } from "../../DateTimeUtils";
import { Close } from "@mui/icons-material";
import OrderedMealsTable from "./OrderedMealsTable";
import { TransitionProps } from "@mui/material/transitions";
import User from "../../models/User";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<unknown>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export const UpcomingMealsDialog: React.FC<{
  user: User;
  onClose: () => void;
}> = ({ user, onClose }) => {
  const today = DateTimeUtils.toString(new Date());


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
            Upcoming Meals For Family Of -{" "}
            {user.firstName + " " + user.lastName}
          </Typography>
        </Toolbar>
      </AppBar>
      {
        <OrderedMealsTable
          user={user}
          startDate={today}
        />
      }
      
    </Dialog>
  );
};

export default UpcomingMealsDialog;
