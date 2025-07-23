import * as React from "react";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridValidRowModel,
} from "@mui/x-data-grid";
import { AppContext } from "../../AppContextProvider";
import { DateTimeUtils } from "../../DateTimeUtils";
import { grey } from "@mui/material/colors";
import { Link } from "@mui/material";
import User, { Role } from "../../models/User";

interface Row {
  id: number;
  col1: string;
  col2: string;
  col3: string | undefined;
  col6: (orderId: number) => void;
}

const MULTI_PURCHASER_COLUMNS: GridColDef[] = [
  {
    field: "col6",
    headerName: "Order #",
    width: 80,
    renderCell: (
      params: GridRenderCellParams<GridValidRowModel, (orderId: number) => void>
    ) => (
      <Link onClick={() => params.value!(params.id as number)}>
        {params.id.toString()}
      </Link>
    ),
  },
  { field: "col1", headerName: "Order Date", width: 100 },
  { field: "col3", headerName: "Username", flex: 1 },
  { field: "col2", headerName: "First/Last Dining Date", flex: 1 },
];

const SINGLE_PURCHASER_COLUMNS: GridColDef[] = [
  {
    field: "col6",
    headerName: "Order #",
    width: 80,
    renderCell: (
      params: GridRenderCellParams<GridValidRowModel, (orderId: number) => void>
    ) => (
      <Link onClick={() => params.value!(params.id as number)}>
        {params.id.toString()}
      </Link>
    ),
  },
  { field: "col1", headerName: "Order Date", width: 100 },
  { field: "col2", headerName: "First/Last Dining Date", flex: 1 },
];

interface OrderHistoryTableProps {
  onShowOrder: (orderId: number) => void;
  user?: User;
  hidden?: boolean;
  mb?: number;
}

const OrderHistoryTable: React.FC<OrderHistoryTableProps> = ({
  onShowOrder,
  user,
  mb,
  hidden,
}) => {
  const rows: Row[] = [];

  const { orders, users, user: loggedInUser } = React.useContext(AppContext);

  const targetUser = user ? user : loggedInUser.role === Role.ADMIN ? undefined : loggedInUser;
  orders
    .filter((order) =>
      !targetUser || order.userId === targetUser?.id
    )
    .forEach((order) => {
      const firstMealDate = orders
        .flatMap((order) => order.meals)
        .map((meal) => meal.date)
        .reduce((d1, d2) => (d1 < d2 ? d1 : d2));
      const lastMealDate = orders
        .flatMap((order) => order.meals)
        .map((meal) => meal.date)
        .reduce((d1, d2) => (d1 > d2 ? d1 : d2));
      rows.push({
        id: order.id,
        col1: DateTimeUtils.toString(order.date),
        col2:
          firstMealDate === lastMealDate
            ? firstMealDate
            : firstMealDate + "/" + lastMealDate,
        col3: targetUser?.userName ?? users.find((user) => user.id === order.userId)?.userName ?? "Unknown",
        col6: onShowOrder,
      });
    });

  return (
    <DataGrid
      sx={{
        display: hidden ? "none" : undefined,
        mb,
        borderColor: grey[400],
        backgroundColor: "white",
      }}
      density="compact"
      rows={rows}
      disableRowSelectionOnClick
      columns={targetUser ? SINGLE_PURCHASER_COLUMNS : MULTI_PURCHASER_COLUMNS}
    />
  );
};

export default OrderHistoryTable;
