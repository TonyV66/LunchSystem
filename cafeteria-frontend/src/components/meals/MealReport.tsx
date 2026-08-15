import * as React from "react";
import { Box, Typography } from "@mui/material";
import { grey } from "@mui/material/colors";
import PantryItemChip from "./PantryItemChip";
import Meal from "../../models/Meal";
import { AppContext } from "../../AppContextProvider";

export interface CustomerData {
  name: string;
  meals: Meal[];
}

export interface ReportData {
  title: string;
  time?: string;
  date: string;
  customers: CustomerData[];
}

const MealReport: React.FC<{ customers: CustomerData[] }> = ({ customers }) => {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        borderWidth: "1px",
        borderStyle: "solid",
      }}
    >
      {customers.map((customer) => (
        <MealReportRow
          key={customer.name}
          name={customer.name}
          meals={customer.meals}
        />
      ))}
    </Box>
  );
};

const MealReportRow: React.FC<CustomerData> = ({ name, meals }) => {
  const { pantryItems } = React.useContext(AppContext);

  if (!meals.length) {
    return <></>;
  }

  return (
    <>
      <Box
        sx={{
          borderBottomWidth: "1px",
          borderBottomColor: grey[400],
          borderBottomStyle: "solid",
          borderRightWidth: "1px",
          borderRightColor: grey[400],
          borderRightStyle: "solid",
          p: 1,
          gridRowEnd: meals.length > 1 ? "span " + meals.length : undefined,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Typography variant="body2">{name}</Typography>
      </Box>
      {meals.map((meal) => (
        <Box
          key={meal.id}
          sx={{
            borderBottomWidth: "1px",
            borderBottomColor: grey[400],
            borderBottomStyle: "solid",
            p: 1,
            display: "flex",
            flexWrap: "wrap",
            flexDirection: "row",
            gap: 1,
          }}
        >
          {meal.items
            .map(
              (item) =>
                pantryItems.find(
                  (pantryItem) => pantryItem.id === item.pantryItemId,
                )!,
            )
            .sort((item1, item2) => {
              return (
                item1.type - item2.type ||
                item1.name.toLowerCase().localeCompare(item2.name.toLowerCase())
              );
            })
            .map((item) => (
              <PantryItemChip key={item.id} pantryItem={item} />
            ))}
        </Box>
      ))}
    </>
  );
};

export default MealReport;
