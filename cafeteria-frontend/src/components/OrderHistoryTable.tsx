import * as React from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { AppContext } from "../AppContextProvider";
import { DateTimeUtils } from "../DateTimeUtils";
import { PantryItemType } from "../models/Menu";
import { grey } from "@mui/material/colors";

interface Row {
  id: string;
  col1: string;
  col2: string;
  col3: string;
  col4: string;
  col5: string;
  col6: number;
  col7: string;
}

const columns: GridColDef[] = [
  { field: "col6", headerName: "Order ID", width: 80 },
  { field: "col1", headerName: "Order Date", width: 100 },
  { field: "col3", headerName: "Purchaser", minWidth: 140 },
  { field: "col4", headerName: "Student ID", width: 90 },
  { field: "col7", headerName: "Student Name", width: 140 },
  { field: "col2", headerName: "Dining Date", width: 100 },
  { field: "col5", headerName: "Items Purchased", flex: 1 },
];

const OrderHistoryTable: React.FC = () => {
  const rows: Row[] = [];

  const { user, orders, students } = React.useContext(AppContext);
  
  orders.forEach((order) => {
    order.meals.forEach((meal) => {
      const student = students.find(student => student.id === meal.studentId);
      rows.push({
        id: "" + order.id + ":" + meal.id,
        col1: DateTimeUtils.toString(order.date),
        col2: DateTimeUtils.toString(meal.date),
        col3: user.name,
        col4: student?.studentId ?? 'Unknown',
        col6: order.id,
        col7: student?.name || 'Unknown',
        col5: meal.items
          .sort((i1, i2) => {
            if (i1.type === i2.type) {
              if (i2.name.toLowerCase() === "dessert") {
                return -1;
              } else if (i1.name.toLowerCase() === "dessert") {
                return 1;
              }
              return i1.name.localeCompare(i2.name);
            } else if (i1.type === PantryItemType.ENTREE) {
              return -1;
            } else if (i1.type === PantryItemType.SIDE) {
              return i2.type === PantryItemType.DESSERT ? -1 : 1;
            } else {
              return 1;
            }
          })
          .map((item) => item.name)
          .join(", "),
      });
    });
  });

  if (!rows.length) {
    return <div>No calls</div>;
  }

  return (
    <DataGrid
      sx={{ fontSize: "12px", borderColor: grey[400], backgroundColor: 'white' }}
      density="compact"
      rows={rows}
      disableRowSelectionOnClick
      columns={columns}
      initialState={{
        columns: {
          columnVisibilityModel: {
            col3: false,
            col4: false,
          },
        },
      }}
    />
  );
}

export default OrderHistoryTable;
