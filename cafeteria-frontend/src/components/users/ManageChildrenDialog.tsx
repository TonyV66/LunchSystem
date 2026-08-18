import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Radio,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { grey } from "@mui/material/colors";
import { AxiosError } from "axios";
import { AppContext } from "../../AppContextProvider";
import SchoolUser from "../../models/SchoolUser";
import Student from "../../models/Student";
import {
  getUserEnrollmentHistory,
  updateUserEnrollments,
  UserChildEnrollment,
} from "../../api/CafeteriaClient";
import StudentAutoCompleteSelector from "./StudentAutoCompleteSelector";

interface ManageChildrenDialogProps {
  user: SchoolUser;
  onClose: () => void;
}

const applyStudentEnrollmentUpdates = (
  currentStudents: Student[],
  children: UserChildEnrollment[],
): Student[] => {
  const byId = new Map(currentStudents.map((student) => [student.id, student]));
  for (const child of children) {
    if (child.student.parents.length > 0) {
      byId.set(child.student.id, child.student);
    } else {
      byId.delete(child.student.id);
    }
  }
  return Array.from(byId.values());
};

const ManageChildrenDialog: React.FC<ManageChildrenDialogProps> = ({
  user,
  onClose,
}) => {
  const {
    students,
    setStudents,
    currentSchoolYear,
    setSnackbarMsg,
    setSnackbarErrorMsg,
  } = useContext(AppContext);

  const [children, setChildren] = useState<UserChildEnrollment[]>([]);
  const [originalEnrolled, setOriginalEnrolled] = useState<Map<number, boolean>>(
    new Map(),
  );
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const history = await getUserEnrollmentHistory(user.id);
        if (cancelled) {
          return;
        }
        setChildren(history);
        setOriginalEnrolled(
          new Map(history.map((child) => [child.student.id, child.enrolled])),
        );
      } catch (error) {
        const axiosError = error as AxiosError;
        if (!cancelled) {
          setSnackbarErrorMsg(
            "Error loading enrollment history: " +
              (axiosError.response?.data?.toString() ??
                axiosError.response?.statusText ??
                "Unknown server error"),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user.id, setSnackbarErrorMsg]);

  const hasChanges = useMemo(
    () =>
      children.some(
        (child) => originalEnrolled.get(child.student.id) !== child.enrolled,
      ),
    [children, originalEnrolled],
  );

  const handleToggleEnrolled = (studentId: number) => {
    setChildren((current) =>
      current.map((child) =>
        child.student.id === studentId
          ? { ...child, enrolled: !child.enrolled }
          : child,
      ),
    );
  };

  const handleAddStudent = () => {
    if (!selectedStudent) {
      return;
    }

    setChildren((current) => {
      const existing = current.find(
        (child) => child.student.id === selectedStudent.id,
      );
      if (existing) {
        if (existing.enrolled) {
          return current;
        }
        return current.map((child) =>
          child.student.id === selectedStudent.id
            ? { ...child, enrolled: true }
            : child,
        );
      }

      return [...current, { student: selectedStudent, enrolled: true }].sort(
        (a, b) =>
          `${a.student.firstName} ${a.student.lastName}`.localeCompare(
            `${b.student.firstName} ${b.student.lastName}`,
          ),
      );
    });
    setSelectedStudent(null);
  };

  const handleSave = async () => {
    if (!currentSchoolYear.id) {
      setSnackbarErrorMsg("No school year selected.");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateUserEnrollments(
        user.id,
        children.map((child) => ({
          studentId: child.student.id,
          enrolled: child.enrolled,
        })),
      );
      setStudents(applyStudentEnrollmentUpdates(students, updated));
      setSnackbarMsg("Enrollment updated");
      onClose();
    } catch (error) {
      const axiosError = error as AxiosError;
      setSnackbarErrorMsg(
        "Error updating enrollment: " +
          (axiosError.response?.data?.toString() ??
            axiosError.response?.statusText ??
            "Unknown server error"),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Manage Children of {user.firstName} {user.lastName}
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress size={28} />
          </Box>
        ) : !currentSchoolYear.id ? (
          <Typography variant="body2" color="error">
            No school year selected.
          </Typography>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {`Enrollment is for the current school year (${currentSchoolYear.name}).`}
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table
                size="small"
                sx={{
                  "& .MuiTableCell-root": {
                    py: 0.25,
                  },
                  "& .MuiTableCell-head": {
                    backgroundColor: grey[200],
                    fontWeight: "bold",
                  },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell align="center">Enrolled</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {children.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2}>
                        <Typography variant="body2" color="text.secondary">
                          No enrollment history found for this user at this
                          school.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    children.map((child) => (
                      <TableRow key={child.student.id}>
                        <TableCell>
                          {`${child.student.firstName} ${child.student.lastName}`}
                        </TableCell>
                        <TableCell align="center" sx={{ py: 0 }}>
                          <Radio
                            size="small"
                            checked={child.enrolled}
                            onClick={() =>
                              handleToggleEnrolled(child.student.id)
                            }
                            disabled={saving}
                            inputProps={{
                              "aria-label": `Enroll ${child.student.firstName} ${child.student.lastName}`,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Stack
              direction="row"
              alignItems="flex-end"
              gap={1}
              sx={{ mt: 2 }}
            >
              <Box flex={1} minWidth={0}>
                <StudentAutoCompleteSelector
                  value={selectedStudent}
                  onChange={setSelectedStudent}
                  label="Add Student"
                  disabled={saving}
                />
              </Box>
              <IconButton
                color="primary"
                onClick={handleAddStudent}
                disabled={saving || !selectedStudent}
                aria-label="Add student"
              >
                <Add />
              </IconButton>
            </Stack>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={
            loading || saving || !hasChanges || !currentSchoolYear.id
          }
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManageChildrenDialog;
