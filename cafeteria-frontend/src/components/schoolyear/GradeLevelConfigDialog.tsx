import React, { useContext } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Radio,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { getGradeName, GradeLevel } from "../../models/GradeLevel";
import SchoolYear from "../../models/SchoolYear";
import { updateGradeLevelConfig } from "../../api/CafeteriaClient";
import { AxiosError } from "axios";
import { AppContext } from "../../AppContextProvider";
import { green, purple } from "@mui/material/colors";

interface Props {
  schoolYear: SchoolYear;
  open: boolean;
  onClose: () => void;
}

const GradeLevelConfigDialog: React.FC<Props> = ({
  schoolYear,
  open,
  onClose,
}) => {
  const { setSnackbarErrorMsg, setSnackbarMsg, schoolYears, setSchoolYears, currentSchoolYear, setCurrentSchoolYear } =
    useContext(AppContext);
  const [localSchoolYear, setLocalSchoolYear] = React.useState<SchoolYear>({
    ...schoolYear,
  });
  const [isSaving, setIsSaving] = React.useState(false);

  const handleRadioChange = (gradeLevel: GradeLevel, byClassroom: boolean) => {
    setLocalSchoolYear((prev) => {
      const currentGrades = prev.gradesAssignedByClass || [];
      let newGrades: GradeLevel[];
      
      if (byClassroom) {
        // Add grade level if not already present
        newGrades = currentGrades.includes(gradeLevel)
          ? currentGrades
          : [...currentGrades, gradeLevel];
      } else {
        // Remove grade level if present
        newGrades = currentGrades.filter((grade) => grade !== gradeLevel);
      }
      
      return {
        ...prev,
        gradesAssignedByClass: newGrades,
      };
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updatedSchoolYear = await updateGradeLevelConfig(
        schoolYear.id,
        localSchoolYear.gradesAssignedByClass || []
      );
      setSnackbarMsg("Grade level configuration updated successfully");

      setSchoolYears(
        schoolYears.map((year) =>
          year.id === updatedSchoolYear.id ? updatedSchoolYear : year
        )
      );
      
      if (currentSchoolYear.id === updatedSchoolYear.id) {
        setCurrentSchoolYear(updatedSchoolYear);
      }

      onClose();
    } catch (error) {
      const axiosError = error as AxiosError;
      setSnackbarErrorMsg(
        "Error updating grade level configuration: " +
          (axiosError.response?.data?.toString() ??
            axiosError.response?.statusText ??
            "Unknown server error")
      );

      console.error("Failed to update grade level configuration:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => {}} maxWidth="sm" fullWidth>
      <DialogTitle>Lunch Time Assignment Method</DialogTitle>
      <DialogContent>
        <TableContainer component={Paper} sx={{ maxHeight: "500px" }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Grade</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  By Grade Level
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  By Classroom
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.values(GradeLevel)
                .filter((grade) => grade !== GradeLevel.UNKNOWN)
                .map((gradeLevel) => (
                  <TableRow key={gradeLevel}>
                    <TableCell sx={{ fontWeight: "medium" }}>
                      {getGradeName(gradeLevel)}
                    </TableCell>
                    <TableCell align="center">
                      <Radio
                        sx={{
                          "&.Mui-checked": {
                            color: green[500],
                          },
                        }}
                        size="small"
                        checked={
                          !localSchoolYear.gradesAssignedByClass?.includes(gradeLevel)
                        }
                        onChange={() => handleRadioChange(gradeLevel, false)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Radio
                        sx={{
                          "&.Mui-checked": {
                            color: purple[300],
                          },
                        }}
                        size="small"
                        checked={
                          localSchoolYear.gradesAssignedByClass?.includes(gradeLevel)
                        }
                        onChange={() => handleRadioChange(gradeLevel, true)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GradeLevelConfigDialog;
