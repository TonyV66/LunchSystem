import React, { useContext } from "react";
import { Box, IconButton } from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams, GridValidRowModel } from "@mui/x-data-grid";
import { grey } from "@mui/material/colors";
import { AppContext } from "../../AppContextProvider";
import { MoreVert } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { SCHOOL_YEAR_URL } from "../../MainAppPanel";

interface Row {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  onEditYear: undefined | ((yearId: number) => void);
}

const SchoolYearsPage: React.FC = () => {
  const {schoolYears} = useContext(AppContext);
  const navigate = useNavigate();

  const rows: Row[] = [];

  const handleShowPopupMenu = (
    yearId: number
  ) => {
    navigate(SCHOOL_YEAR_URL + "/" + yearId);
  };


  const columns: GridColDef[] = [
    { field: "username", headerName: "Name", minWidth: 150 },
    { field: "startDate", headerName: "Start Date", flex: 1 },
    { field: "endDate", headerName: "End Date", flex: 1 },
    {
      field: "onEditYear",
      headerName: "Actions",
      width: 80,
      renderCell: (
        params: GridRenderCellParams<GridValidRowModel, (yearId: number) => void>
      ) => (
        <IconButton
          color="primary"
          disabled={!params.value}
          onClick={() =>
            params.value!(
              params.id as number,
            )
          }
          size="small"
        >
          <MoreVert />
        </IconButton>
      ),
    },
  ];
  

  schoolYears.forEach((year) => {
    rows.push({
      id: year.id,
      name: year.name,
      startDate: year.startDate,
      endDate: year.endDate,
      onEditYear: year.id !== year.id ? handleShowPopupMenu : undefined,
    });
  });

  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 4 }}>
      <DataGrid
        sx={{
          marginBottom: "10px",
          gridColumn: "span 2",
          borderColor: grey[400],
          backgroundColor: "white",
        }}
        density="compact"
        rows={rows}
        disableRowSelectionOnClick
        columns={columns}
      />
    </Box>
  );
};

export default SchoolYearsPage;
