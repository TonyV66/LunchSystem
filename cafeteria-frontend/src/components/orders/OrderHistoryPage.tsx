import * as React from "react";
import { Box } from "@mui/material";
import OrderHistoryTable from "./OrderHistoryTable";
import { useState } from "react";
import User from "../../models/User";
import { OrderDialog } from "./OrderDialog";

const OrderHistoryPage: React.FC<{purchaser?: User}> = ({purchaser}) => {
  const [orderId, setOrderId] = useState<number>()
  return (
    <Box p={2} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <OrderHistoryTable purchaser={purchaser} onShowOrder={setOrderId}></OrderHistoryTable>
      {orderId ? <OrderDialog orderId={orderId} onClose={() => setOrderId(undefined)}/> : <></>}
    </Box>
  );
};

export default OrderHistoryPage;
