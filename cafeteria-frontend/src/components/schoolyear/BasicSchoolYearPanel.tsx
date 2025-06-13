import React from "react";
import { Box, FormControl, TextField } from "@mui/material";
import { DateRange } from "react-date-range";
import type { RangeKeyDict } from "react-date-range";
import SchoolYear from "../../models/SchoolYear";
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

interface PanelProps {
  schoolYear: SchoolYear;
  onSchoolYearChanged: (schoolYear: SchoolYear) => void;
}

const BasicSchoolYearPanel: React.FC<PanelProps> = ({ schoolYear, onSchoolYearChanged }) => {
  const handleNameChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSchoolYearChanged({
      ...schoolYear,
      name: event.target.value,
    });
  };

  const handleDatesChanged = (ranges: RangeKeyDict) => {
    const range = ranges.selection;
    if (range.startDate && range.endDate) {
      const startYear = range.startDate.getFullYear();
      const endYear = range.endDate.getFullYear();
      onSchoolYearChanged({
        ...schoolYear,
        name: `${startYear} - ${endYear}`,
        startDate: range.startDate.toISOString().split('T')[0],
        endDate: range.endDate.toISOString().split('T')[0],
      });
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3 }}>
      <FormControl>
        <TextField
          label="Name"
          variant="standard"
          value={schoolYear.name}
          onChange={handleNameChanged}
        />
      </FormControl>
      <Box sx={{border: 1, borderColor: "divider", borderRadius: 3, overflow: "hidden"}}>
        <DateRange
          editableDateInputs={false}
          onChange={handleDatesChanged}
          moveRangeOnFirstSelection={false}
          ranges={[
            {
              startDate: new Date(schoolYear.startDate),
              endDate: new Date(schoolYear.endDate),
              key: "selection",
            },
          ]}
        />
      </Box>
    </Box>
  );
};

export default BasicSchoolYearPanel;
