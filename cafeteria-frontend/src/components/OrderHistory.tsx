import * as React from "react";
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
import { useContext } from "react";
import { AppContext } from "../AppContextProvider";
import { DateTimeFormat, DateTimeUtils } from "../DateTimeUtils";
import { Close, ExpandMore } from "@mui/icons-material";
import { Order } from "../models/Order";
import OrderedMealsTable from "../OrderedMealsTable";
import { TransitionProps } from "@mui/material/transitions";
import User from "../models/User";

const OrderAccordion: React.FC<{ order: Order }> = ({ order }) => {
  return (
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMore />}
        aria-controls="panel1-content"
        id="panel1-header"
        sx={{ flexDirection: "row-reverse" }}
      >
        <Typography fontWeight="bold" variant="body1">
          #{order.id.toString()}&nbsp;-&nbsp;
          {DateTimeUtils.toString(
            order.date,
            DateTimeFormat.SHORT_DAY_OF_WEEK_DESC
          )}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <OrderedMealsTable
          orders={[order]}
          hideDate={false}
          hidePrice={false}
        ></OrderedMealsTable>
      </AccordionDetails>
    </Accordion>
  );
};

const OrderHistory: React.FC<{ userId?: number }> = ({ userId }) => {
  const { orders } = useContext(AppContext);

  return (
    <Box p={2} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ overflowX: "visible" }}>
        {orders
          .filter((order) => !userId || order.userId === userId)
          .sort((o1, o2) => o1.date.localeCompare(o2.date) * -1)
          .map((order) => (
            <OrderAccordion key={order.id} order={order} />
          ))}
      </Box>
    </Box>
  );
};

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<unknown>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export const OrderHistoryDialog: React.FC<{
  user: User;
  onClose: () => void;
}> = ({ user, onClose }) => {
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
            Order History - {user.userName}
          </Typography>
        </Toolbar>
      </AppBar>
      <OrderHistory userId={user.id} />
    </Dialog>
  );
};

export default OrderHistory;
