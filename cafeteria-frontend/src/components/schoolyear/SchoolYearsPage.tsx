import React, { useContext, useState } from "react";
import { Box, Fab, IconButton, Stack, Typography } from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridValidRowModel,
} from "@mui/x-data-grid";
import { green, grey } from "@mui/material/colors";
import { AppContext } from "../../AppContextProvider";
import { Add, Edit } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { SCHOOL_YEAR_URL } from "../../MainAppPanel";
import SchoolYearDialog from "./SchoolYearDialog";

interface Row {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  onEditYear: undefined | ((yearId: number) => void);
}

const SchoolYearsPage: React.FC = () => {
  const { schoolYears, currentSchoolYear } = useContext(AppContext);
  const navigate = useNavigate();
  const [showSchoolYearDialog, setShowSchoolYearDialog] = useState(false);

  const handleCloseDialog = () => {
    setShowSchoolYearDialog(false);
  };

  const rows: Row[] = [];

  const handleShowSchoolYear = (yearId: number) => {
    navigate(SCHOOL_YEAR_URL + "/" + yearId);
  };

  // Sort school years by start date in descending order (newest first)
  const sortedSchoolYears = [...schoolYears].sort((a, b) => 
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  sortedSchoolYears.forEach((year) => {
    rows.push({
      id: year.id,
      name: year.name,
      startDate: year.startDate,
      endDate: year.endDate,
      onEditYear: handleShowSchoolYear,
    });
  });

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Name",
      minWidth: 150,
      cellClassName: (params) => {
        return params.id === currentSchoolYear.id ? "current-year" : "";
      },
    },
    {
      field: "startDate",
      headerName: "Start Date",
      flex: 1,
      cellClassName: (params) => {
        return params.id === currentSchoolYear.id ? "current-year" : "";
      },
    },
    {
      field: "endDate",
      headerName: "End Date",
      flex: 1,
      cellClassName: (params) => {
        return params.id === currentSchoolYear.id ? "current-year" : "";
      },
    },
    {
      field: "onEditYear",
      headerName: "Actions",
      width: 80,
      cellClassName: (params) => {
        return params.id === currentSchoolYear.id ? "current-year" : "";
      },
      renderCell: (
        params: GridRenderCellParams<
          GridValidRowModel,
          (yearId: number) => void
        >
      ) => (
        <IconButton
          color="primary"
          onClick={() => params.value!(params.id as number)}
          size="small"
        >
          <Edit />
        </IconButton>
      ),
    },
  ];

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
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-end"
      >
        <Stack direction="row" alignItems="center" gap={1}>
          <Box
            sx={{
              width: "12px",
              height: "12px",
              backgroundColor: green[200],
              border: "1px solid darkgrey",
              borderRadius: "50%",
            }}
          ></Box>
          <Typography variant="body2">Active School Year</Typography>
        </Stack>
        <Fab
          size="small"
          onClick={() => setShowSchoolYearDialog(true)}
          color="primary"
          sx={{ marginTop: "8px", alignSelf: "flex-end" }}
        >
          <Add />
        </Fab>
      </Stack>

      <DataGrid
        sx={{
          mb: 2,
          borderColor: grey[400],
          backgroundColor: "white",
          [`.current-year`]: {
            backgroundColor: green[100],
          },
        }}
        density="compact"
        rows={rows}
        disableRowSelectionOnClick
        columns={columns}
      />

      {showSchoolYearDialog && <SchoolYearDialog onClose={handleCloseDialog} />}
    </Stack>
  );
};

export default SchoolYearsPage;
