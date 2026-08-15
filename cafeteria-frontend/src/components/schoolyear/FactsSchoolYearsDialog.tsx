import React, { useContext, useEffect, useState } from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Radio,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import {
  createSchoolYear,
  fetchFactsSchoolYears,
  pollFactsJob,
} from "../../api/CafeteriaClient";
import { AppContext } from "../../AppContextProvider";
import { SCHOOL_YEAR_URL } from "../../MainAppPanel";
import SchoolYear from "../../models/SchoolYear";
import ProgressDialog from "../ProgressDialog";

interface FactsSchoolYearsDialogProps {
  onClose: (schoolYear?: SchoolYear) => void;
}

const FactsSchoolYearsDialog: React.FC<FactsSchoolYearsDialogProps> = ({
  onClose,
}) => {
  const {
    schoolYears,
    setSchoolYears,
    setSnackbarErrorMsg,
  } = useContext(AppContext);
  const navigate = useNavigate();
  const [factsSchoolYears, setFactsSchoolYears] = useState<SchoolYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showImportProgress, setShowImportProgress] = useState(false);
  const [importProgressComplete, setImportProgressComplete] = useState(false);
  const [importProgressMessage, setImportProgressMessage] = useState("");
  const [importedSchoolYear, setImportedSchoolYear] = useState<
    SchoolYear | undefined
  >();

  useEffect(() => {
    const loadFactsSchoolYears = async () => {
      try {
        setIsLoading(true);
        const years = await fetchFactsSchoolYears();
        setFactsSchoolYears(
          [...years].sort(
            (a, b) =>
              new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
          ),
        );
      } catch (error) {
        const axiosError = error as AxiosError;
        setSnackbarErrorMsg(
          axiosError.response?.data?.toString() ??
            axiosError.message ??
            "Failed to load FACTS school years",
        );
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    loadFactsSchoolYears();
  }, [setSnackbarErrorMsg]);

  const handleSave = async () => {
    const selectedYear = factsSchoolYears.find(
      (year) => year.id === selectedYearId,
    );
    if (!selectedYear) {
      return;
    }

    setIsSaving(true);
    setShowImportProgress(true);
    setImportProgressComplete(false);
    setImportedSchoolYear(undefined);
    setImportProgressMessage(
      "Importing school year from FACTS. This may take several minutes…",
    );

    try {
      const { schoolYear: savedSchoolYear, jobId } = await createSchoolYear({
        id: 0,
        name: selectedYear.name,
        startDate: selectedYear.startDate,
        endDate: selectedYear.endDate,
        factsId: selectedYear.factsId,
        isCurrent: false,
        hideSchedule: true,
        oneTeacherPerStudent: true,
        lunchTimes: [],
        teacherLunchTimes: [],
        gradeLunchTimes: [],
        studentLunchTimes: [],
        gradesAssignedByClass: [],
      });

      setSchoolYears([...schoolYears, savedSchoolYear]);

      if (jobId) {
        const job = await pollFactsJob(jobId, setImportProgressMessage);
        if (job.status === "failed") {
          setImportProgressMessage(job.message);
          setImportProgressComplete(true);
          return;
        }
        setImportedSchoolYear(savedSchoolYear);
        setImportProgressMessage(job.message);
      } else {
        setImportedSchoolYear(savedSchoolYear);
        setImportProgressMessage("Import from FACTS is complete.");
      }
      setImportProgressComplete(true);
    } catch (error) {
      if (error instanceof AxiosError) {
        setImportProgressMessage(
          `Import failed: ${error.response?.data ?? error.message}`,
        );
      } else {
        setImportProgressMessage("Import failed: An unknown error occurred.");
      }
      setImportProgressComplete(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImportProgressOk = () => {
    setShowImportProgress(false);
    if (importedSchoolYear) {
      navigate(SCHOOL_YEAR_URL + "/" + importedSchoolYear.id);
      onClose(importedSchoolYear);
      return;
    }
    setImportProgressComplete(false);
    setImportProgressMessage("");
  };

  return (
    <>
      <Dialog open={true} maxWidth="md" fullWidth>
        <DialogTitle>Import FACTS School Year</DialogTitle>
        <DialogContent>
          {isLoading ? (
            <CircularProgress
              size={32}
              sx={{ display: "block", mx: "auto", my: 4 }}
            />
          ) : factsSchoolYears.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              No school years were returned from FACTS.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" />
                  <TableCell>Name</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {factsSchoolYears.map((year) => (
                  <TableRow
                    key={year.id}
                    hover
                    selected={selectedYearId === year.id}
                    onClick={() =>
                      !isSaving && setSelectedYearId(year.id)
                    }
                    sx={{ cursor: isSaving ? "default" : "pointer" }}
                  >
                    <TableCell padding="checkbox">
                      <Radio
                        checked={selectedYearId === year.id}
                        onChange={() => setSelectedYearId(year.id)}
                        value={year.id}
                        size="small"
                        disabled={isSaving}
                      />
                    </TableCell>
                    <TableCell>{year.name}</TableCell>
                    <TableCell>{year.startDate}</TableCell>
                    <TableCell>{year.endDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => onClose()}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={selectedYearId === null || isLoading || isSaving}
          >
            Create School Year
          </Button>
        </DialogActions>
      </Dialog>
      <ProgressDialog
        open={showImportProgress}
        title="Import FACTS School Year"
        message={importProgressMessage}
        isComplete={importProgressComplete}
        onOk={handleImportProgressOk}
      />
    </>
  );
};

export default FactsSchoolYearsDialog;
