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
  { field: "col3", headerName: "Purchaser", flex: 1 },
  { field: "col2", headerName: "First - Last Meal Date", flex: 1 },
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

// Helper function to format dates as mm/dd/yy
const formatDateAsMMDDYY = (date: string): string => {
  const dateParts = DateTimeUtils.getDateParts(date);
  const day = DateTimeUtils.pad2(dateParts.date);
  const month = DateTimeUtils.pad2(dateParts.month);
  const year = dateParts.year.toString().slice(-2); // Get last 2 digits of year
  return `${month}/${day}/${year}`;
};

const OrderHistoryTable: React.FC<OrderHistoryTableProps> = ({
  onShowOrder,
  user,
  mb,
  hidden,
}) => {
  const rows: Row[] = [];

  const { orders, users, user: loggedInUser } = React.useContext(AppContext);

  const targetUser = user ? user : loggedInUser.role === Role.ADMIN || loggedInUser.role === Role.PRINCIPAL ? undefined : loggedInUser;
  orders
    .filter((order) =>
      !targetUser || order.userId === targetUser?.id
    )
    .forEach((order) => {
      let userName = "Unknown";
      if (targetUser) {
        if (targetUser.firstName || targetUser.lastName) {
          userName = targetUser.firstName + " " + targetUser.lastName;
        } else {
          userName = targetUser.userName;
        }
      } else {
        const tmpUser = users.find((user) => user.id === order.userId);
        if (tmpUser) {
          if (tmpUser.firstName || tmpUser.lastName) {
            userName = tmpUser.firstName + " " + tmpUser.lastName;
          } else {
            userName = tmpUser.userName;
          }
        }
      }
      const firstMealDate = order.meals
        .map((meal) => meal.date)
        .reduce((d1, d2) => (d1 < d2 ? d1 : d2));
      const lastMealDate = order.meals
        .map((meal) => meal.date)
        .reduce((d1, d2) => (d1 > d2 ? d1 : d2));
      rows.push({
        id: order.id,
        col1: formatDateAsMMDDYY(order.date),
        col2:
          firstMealDate === lastMealDate
            ? formatDateAsMMDDYY(firstMealDate)
            : formatDateAsMMDDYY(firstMealDate) + " - " + formatDateAsMMDDYY(lastMealDate),
        col3: userName,
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
