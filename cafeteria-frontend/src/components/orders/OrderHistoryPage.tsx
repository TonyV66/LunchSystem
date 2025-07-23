import * as React from "react";
import { Stack, Typography } from "@mui/material";
import OrderHistoryTable from "./OrderHistoryTable";
import { useContext, useState } from "react";
import User from "../../models/User";
import { OrderDialog } from "./OrderDialog";
import { AppContext } from "../../AppContextProvider";

const OrderHistoryPage: React.FC<{ purchaser?: User }> = ({ purchaser }) => {
  const [orderId, setOrderId] = useState<number>();
  const { currentSchoolYear } = useContext(AppContext);

  return (
    <Stack
      pl={2}
      pr={2}
      direction="column"
      gap={1}
      sx={{
        height: "100%",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
        <Typography fontWeight="bold">Order History</Typography>
        <Stack direction="column">
          <Typography variant="body2" fontWeight="bold">
            School Year:
          </Typography>
          <Typography
            variant="body2"
            color={!currentSchoolYear.id ? "error" : "text.primary"}
          >
            {currentSchoolYear.name || "No School Year Selected"}
          </Typography>
        </Stack>

      </Stack>
      <OrderHistoryTable
        mb={2}
        user={purchaser}
        onShowOrder={setOrderId}
      ></OrderHistoryTable>
      {orderId ? (
        <OrderDialog orderId={orderId} onClose={() => setOrderId(undefined)} />
      ) : (
        <></>
      )}
    </Stack>
  );
};

export default OrderHistoryPage;
