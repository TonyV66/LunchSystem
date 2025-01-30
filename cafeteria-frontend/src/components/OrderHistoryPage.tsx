import * as React from "react";
import { Box } from "@mui/material";
import OrderHistoryTable from "./OrderHistoryTable";

const OrderHistoryPage: React.FC = () => {
  return (
    <Box p={2} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <OrderHistoryTable></OrderHistoryTable>
    </Box>
  );
};

export default OrderHistoryPage;
