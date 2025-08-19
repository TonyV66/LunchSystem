import * as React from "react";
import { Box, Typography } from "@mui/material";
import Meal from "../../models/Meal";
import { DateTimeFormat, DateTimeUtils } from "../../DateTimeUtils";

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

const PrintableMealReport: React.FC<{ reportData: ReportData }> = ({
  reportData,
}) => {
  return (
    <Box sx={{ pageBreakBefore: "always" }}>
      <Box>
        <Typography variant="body1" fontWeight="bold">
          {reportData.title}
        </Typography>
        <Typography variant="body2" fontWeight="bold">
          {DateTimeUtils.toString(
            reportData.date,
            DateTimeFormat.SHORT_DAY_OF_WEEK_DESC
          )}{" "}
          @ {reportData.time}
        </Typography>
      </Box>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "10px",
          border: "1px solid #000",
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                border: "1px solid #333",
                padding: "8px",
                textAlign: "left",
              }}
            >
              <Typography variant="body2" fontWeight="bold">
                Name
              </Typography>
            </th>
            <th
              style={{
                border: "1px solid #333",
                padding: "8px",
                textAlign: "left",
              }}
            >
              <Typography variant="body2" fontWeight="bold">
                Meal Items
              </Typography>
            </th>
          </tr>
        </thead>
        <tbody>
          {reportData.customers.map((customer) => (
            <MealReportRow
              key={customer.name}
              name={customer.name}
              meals={customer.meals}
            />
          ))}
        </tbody>
      </table>
    </Box>
  );
};

const MealReportRow: React.FC<CustomerData> = ({ name, meals }) => {
  return (
    <>
      {meals.map((meal, mealIndex) => (
        <tr key={meal.id}>
          <td
            style={{
              border: "1px solid #333",
              padding: "8px",
              textAlign: "left",
            }}
          >
            <Typography variant="body2">
              {mealIndex === 0 ? name : ""}
            </Typography>
          </td>
          <td
            style={{
              border: "1px solid #333",
              padding: "8px",
              textAlign: "left",
            }}
          >
            <Typography variant="body2">
              {[...meal.items]
                .sort((item1, item2) => {
                  return (
                    item1.type - item2.type ||
                    item1.name
                      .toLowerCase()
                      .localeCompare(item2.name.toLowerCase())
                  );
                })
                .map((item) => item.name)
                .join(", ")}
            </Typography>
          </td>
        </tr>
      ))}
    </>
  );
};

export default PrintableMealReport;
