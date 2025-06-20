import * as React from "react";
import {
  AppBar,
  Box,
  Dialog,
  IconButton,
  Link,
  Slide,
  Toolbar,
  Typography,
} from "@mui/material";
import { useContext, useState } from "react";
import { AppContext } from "../../AppContextProvider";
import { Close } from "@mui/icons-material";
import OrderedMealsTable from "../meals/OrderedMealsTable";
import { TransitionProps } from "@mui/material/transitions";
import User from "../../models/User";
import OrderHistoryTable from "./OrderHistoryTable";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<unknown>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export const UserOrderHistoryDialog: React.FC<{
  user: User;
  onClose: () => void;
}> = ({ user, onClose }) => {
  const [orderDetailsId, setOrderDetailsId] = useState<number>();
  const { orders, users, students } = useContext(AppContext);

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
            {orderDetailsId
              ? "Order #" + orderDetailsId
              : "Order History - " + user.userName}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box p={2}>
        <Box hidden={orderDetailsId ? true : false}>
          <OrderHistoryTable purchaser={user} onShowOrder={setOrderDetailsId} />
        </Box>
        {orderDetailsId ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Box>
              <Link
                onClick={() => {
                  setOrderDetailsId(undefined);
                }}
                component="button"
              >
                Back To Order History
              </Link>
            </Box>
            <OrderedMealsTable
              orders={[orders.find((order) => order.id === orderDetailsId)!]}
              students={students}
              staffMembers={users}
              hideDate={false}
              hidePrice={false}
            ></OrderedMealsTable>
          </Box>
        ) : (
          <></>
        )}
      </Box>
    </Dialog>
  );
};