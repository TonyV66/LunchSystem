import React, { useContext, useState } from "react";
import {
  Box,
  Fab,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridValidRowModel,
} from "@mui/x-data-grid";
import { green, grey } from "@mui/material/colors";
import { AppContext } from "../../AppContextProvider";
import { Add, CloudUpload, Edit, Sync } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { SCHOOL_YEAR_URL } from "../../MainAppPanel";
import SchoolYearDialog from "./SchoolYearDialog";
import FactsSchoolYearsDialog from "./FactsSchoolYearsDialog";
import UserImportDialog from "../users/UserImportDialog";
import ConfirmDialog from "../ConfirmDialog";
import ProgressDialog from "../ProgressDialog";
import { synchronizeSchoolYear, pollFactsJob, fetchSessionInfo } from "../../api/CafeteriaClient";
import { AxiosError } from "axios";
import { NO_SCHOOL_YEAR } from "../../models/SchoolYear";

interface Row {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  factsId: number | null;
  onEditYear: undefined | ((yearId: number) => void);
}

const SchoolYearsPage: React.FC = () => {
  const {
    school,
    schoolYears,
    currentSchoolYear,
    setUser,
    setUsers,
    setStudents,
    setOrders,
    setMenus,
    setScheduledMenus,
    setNotifications,
    setPantryItems,
    setIngredients,
    setUnitsOfMeasure,
    setSchool,
    setSchoolYears,
    setCurrentSchoolYear,
  } = useContext(AppContext);
  const navigate = useNavigate();
  const [showSchoolYearDialog, setShowSchoolYearDialog] = useState(false);
  const [showFactsSchoolYearsDialog, setShowFactsSchoolYearsDialog] =
    useState(false);
  const [showUserImportDialog, setShowUserImportDialog] = useState(false);
  const [syncYearId, setSyncYearId] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [showSyncProgress, setShowSyncProgress] = useState(false);
  const [syncProgressComplete, setSyncProgressComplete] = useState(false);
  const [syncProgressMessage, setSyncProgressMessage] = useState("");

  const isFactsSchool = Boolean(school.factsApiKey?.trim());
  const syncYear = schoolYears.find((year) => year.id === syncYearId);

  const refreshSession = async () => {
    const updatedSessionInfo = await fetchSessionInfo();
    setUser(updatedSessionInfo.user);
    setUsers(updatedSessionInfo.users);
    setStudents(updatedSessionInfo.students);
    setOrders(updatedSessionInfo.orders);
    setMenus(updatedSessionInfo.menus);
    setScheduledMenus(updatedSessionInfo.scheduledMenus);
    setNotifications(updatedSessionInfo.notifications);
    setPantryItems(updatedSessionInfo.pantryItems);
    setIngredients(updatedSessionInfo.ingredients);
    setUnitsOfMeasure(updatedSessionInfo.unitsOfMeasure);
    setSchool(updatedSessionInfo.school);
    setSchoolYears(updatedSessionInfo.schoolYears);
    setCurrentSchoolYear(
      updatedSessionInfo.schoolYears.find((sy) => sy.isCurrent) ??
        NO_SCHOOL_YEAR,
    );
  };

  const handleCloseDialog = () => {
    setShowSchoolYearDialog(false);
  };

  const handleCloseFactsDialog = () => {
    setShowFactsSchoolYearsDialog(false);
  };

  const handleAddClicked = () => {
    if (school.factsApiKey) {
      setShowFactsSchoolYearsDialog(true);
    } else {
      setShowSchoolYearDialog(true);
    }
  };

  const handleCloseUserImportDialog = () => {
    setShowUserImportDialog(false);
  };

  const handleShowSchoolYear = (yearId: number) => {
    navigate(SCHOOL_YEAR_URL + "/" + yearId);
  };

  const handleConfirmSynchronize = async () => {
    if (syncYearId == null) {
      return;
    }

    const yearId = syncYearId;
    setSyncYearId(null);
    setSyncing(true);
    setShowSyncProgress(true);
    setSyncProgressComplete(false);
    setSyncProgressMessage(
      "Synchronizing with FACTS. This may take several minutes…",
    );

    try {
      const { jobId } = await synchronizeSchoolYear(yearId);
      const job = await pollFactsJob(jobId, setSyncProgressMessage);

      if (job.status === "failed") {
        setSyncProgressMessage(job.message);
        setSyncProgressComplete(true);
        return;
      }

      await refreshSession();

      setSyncProgressMessage(job.message);
      setSyncProgressComplete(true);
    } catch (error) {
      if (error instanceof AxiosError) {
        setSyncProgressMessage(
          `Synchronization failed: ${
            error.response?.data ?? error.message
          }`,
        );
      } else {
        setSyncProgressMessage("Synchronization failed: An unknown error occurred.");
      }
      setSyncProgressComplete(true);
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncProgressOk = () => {
    setShowSyncProgress(false);
    setSyncProgressComplete(false);
    setSyncProgressMessage("");
  };

  const rows: Row[] = [];

  const sortedSchoolYears = [...schoolYears].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );

  sortedSchoolYears.forEach((year) => {
    rows.push({
      id: year.id,
      name: year.name,
      startDate: year.startDate,
      endDate: year.endDate,
      factsId: year.factsId,
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
      width: isFactsSchool ? 140 : 140,
      cellClassName: (params) => {
        return params.id === currentSchoolYear.id ? "current-year" : "";
      },
      renderCell: (
        params: GridRenderCellParams<
          GridValidRowModel,
          (yearId: number) => void
        >,
      ) => (
        <Stack direction="row" justifyContent="flex-end" gap={1}>
          {!isFactsSchool && params.id === currentSchoolYear.id && (
            <IconButton
              color="primary"
              size="small"
              onClick={() => setShowUserImportDialog(true)}
              title="Import users from CSV"
            >
              <CloudUpload />
            </IconButton>
          )}
          {isFactsSchool &&
            Boolean(params.row.factsId) &&
            params.id === currentSchoolYear.id && (
            <IconButton
              color="primary"
              size="small"
              onClick={() => setSyncYearId(params.id as number)}
              title="Synchronize with FACTS"
            >
              <Sync />
            </IconButton>
          )}
          <IconButton
            color="primary"
            onClick={() => params.value!(params.id as number)}
            size="small"
          >
            <Edit />
          </IconButton>
        </Stack>
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
          onClick={handleAddClicked}
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
      {showFactsSchoolYearsDialog && (
        <FactsSchoolYearsDialog onClose={handleCloseFactsDialog} />
      )}
      <UserImportDialog
        open={showUserImportDialog}
        onClose={handleCloseUserImportDialog}
        onImportComplete={() => {
          void refreshSession();
        }}
      />
      {syncYearId != null && (
        <ConfirmDialog
          title="Synchronize with FACTS"
          open={true}
          okLabel="Synchronize"
          isOkDisabled={syncing}
          onOk={handleConfirmSynchronize}
          onCancel={() => setSyncYearId(null)}
        >
          <Typography variant="body2">
            {`Synchronize "${syncYear?.name ?? "this school year"}" with the latest FACTS information? This will update parents, students, teachers, staff, and enrollments from FACTS.`}
          </Typography>
        </ConfirmDialog>
      )}
      <ProgressDialog
        open={showSyncProgress}
        title="Synchronize with FACTS"
        message={syncProgressMessage}
        isComplete={syncProgressComplete}
        onOk={handleSyncProgressOk}
      />
    </Stack>
  );
};

export default SchoolYearsPage;
