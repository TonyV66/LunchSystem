import React, { useContext, useMemo, useState } from "react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Typography,
} from "@mui/material";
import { AxiosError } from "axios";
import {
  saveGradeLunchTimes,
  saveTeacherLunchTimes,
} from "../../api/CafeteriaClient";
import { AppContext } from "../../AppContextProvider";
import { DateTimeFormat, DateTimeUtils } from "../../DateTimeUtils";
import { getGradeName, GradeLevel } from "../../models/GradeLevel";
import GradeLunchTime from "../../models/GradeLunchTime";
import TeacherLunchTime from "../../models/TeacherLunchTime";

interface BlockedLunchTimesDialogProps {
  date: string;
  onClose: () => void;
}

const gradeOrder = [
  GradeLevel.PRE_K2,
  GradeLevel.PRE_K3,
  GradeLevel.PRE_K4,
  GradeLevel.KINDERGARTEN,
  GradeLevel.FIRST,
  GradeLevel.SECOND,
  GradeLevel.THIRD,
  GradeLevel.FOURTH,
  GradeLevel.FIFTH,
  GradeLevel.SIXTH,
  GradeLevel.SEVENTH,
  GradeLevel.EIGHTH,
  GradeLevel.NINTH,
  GradeLevel.TENTH,
  GradeLevel.ELEVENTH,
  GradeLevel.TWELFTH,
  GradeLevel.UNKNOWN,
];

const withBlockedDate = (
  blockedDates: string[] | undefined,
  date: string,
  blocked: boolean,
): string[] => {
  const current = blockedDates ?? [];
  if (blocked) {
    return current.includes(date) ? current : [...current, date];
  }
  return current.filter((blockedDate) => blockedDate !== date);
};

const BlockedLunchTimesDialog: React.FC<BlockedLunchTimesDialogProps> = ({
  date,
  onClose,
}) => {
  const {
    users,
    currentSchoolYear,
    setCurrentSchoolYear,
    schoolYears,
    setSchoolYears,
    setSnackbarErrorMsg,
    setSnackbarMsg,
  } = useContext(AppContext);

  const dayOfWeek = DateTimeUtils.toDate(date).getDay();

  const gradeLunchTimesForDay = useMemo(
    () =>
      currentSchoolYear.gradeLunchTimes
        .filter((glt) => glt.dayOfWeek === dayOfWeek)
        .sort(
          (a, b) =>
            gradeOrder.indexOf(a.grade) - gradeOrder.indexOf(b.grade),
        ),
    [currentSchoolYear.gradeLunchTimes, dayOfWeek],
  );

  const teacherLunchTimesForDay = useMemo(() => {
    return currentSchoolYear.teacherLunchTimes
      .filter((tlt) => tlt.dayOfWeek === dayOfWeek)
      .sort((a, b) => {
        const userA = users.find((user) => user.id === a.teacherId);
        const userB = users.find((user) => user.id === b.teacherId);
        const nameA =
          userA?.name ||
          `${userA?.firstName ?? ""} ${userA?.lastName ?? ""}`.trim();
        const nameB =
          userB?.name ||
          `${userB?.firstName ?? ""} ${userB?.lastName ?? ""}`.trim();
        return nameA.localeCompare(nameB);
      });
  }, [currentSchoolYear.teacherLunchTimes, dayOfWeek, users]);

  const [blockedGrades, setBlockedGrades] = useState<GradeLevel[]>(() =>
    gradeLunchTimesForDay
      .filter((glt) => (glt.blockedDates ?? []).includes(date))
      .map((glt) => glt.grade),
  );

  const [blockedTeacherIds, setBlockedTeacherIds] = useState<number[]>(() =>
    teacherLunchTimesForDay
      .filter((tlt) => (tlt.blockedDates ?? []).includes(date))
      .map((tlt) => tlt.teacherId),
  );

  const [saving, setSaving] = useState(false);

  const getTeacherName = (teacherId: number): string => {
    const teacher = users.find((user) => user.id === teacherId);
    if (!teacher) {
      return `Teacher #${teacherId}`;
    }
    return (
      teacher.name ||
      `${teacher.firstName} ${teacher.lastName}`.trim() ||
      `Teacher #${teacherId}`
    );
  };

  const handleToggleGrade = (grade: GradeLevel) => {
    setBlockedGrades((prev) =>
      prev.includes(grade)
        ? prev.filter((g) => g !== grade)
        : [...prev, grade],
    );
  };

  const handleToggleTeacher = (teacherId: number) => {
    setBlockedTeacherIds((prev) =>
      prev.includes(teacherId)
        ? prev.filter((id) => id !== teacherId)
        : [...prev, teacherId],
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedGradeLunchTimes = currentSchoolYear.gradeLunchTimes.map(
        (glt) => {
          if (glt.dayOfWeek !== dayOfWeek) {
            return glt;
          }
          return {
            ...glt,
            blockedDates: withBlockedDate(
              glt.blockedDates,
              date,
              blockedGrades.includes(glt.grade),
            ),
          };
        },
      );

      const updatedTeacherLunchTimes = currentSchoolYear.teacherLunchTimes.map(
        (tlt) => {
          if (tlt.dayOfWeek !== dayOfWeek) {
            return tlt;
          }
          return {
            ...tlt,
            blockedDates: withBlockedDate(
              tlt.blockedDates,
              date,
              blockedTeacherIds.includes(tlt.teacherId),
            ),
          };
        },
      );

      const gradeSaves = gradeLunchTimesForDay
        .map((original) => {
          const updated = updatedGradeLunchTimes.find(
            (glt) =>
              glt.grade === original.grade && glt.dayOfWeek === dayOfWeek,
          )!;
          const originalBlocked = [...(original.blockedDates ?? [])].sort();
          const updatedBlocked = [...(updated.blockedDates ?? [])].sort();
          if (
            originalBlocked.join("|") === updatedBlocked.join("|")
          ) {
            return null;
          }
          return saveGradeLunchTimes(currentSchoolYear.id, original.grade, [
            updated,
          ]);
        })
        .filter(Boolean);

      const teacherIdsToSave = teacherLunchTimesForDay
        .map((tlt) => tlt.teacherId)
        .filter(
          (teacherId, index, ids) => ids.indexOf(teacherId) === index,
        )
        .filter((teacherId) => {
          const original = teacherLunchTimesForDay.find(
            (tlt) => tlt.teacherId === teacherId,
          )!;
          const updated = updatedTeacherLunchTimes.find(
            (tlt) =>
              tlt.teacherId === teacherId && tlt.dayOfWeek === dayOfWeek,
          )!;
          const originalBlocked = [...(original.blockedDates ?? [])].sort();
          const updatedBlocked = [...(updated.blockedDates ?? [])].sort();
          return originalBlocked.join("|") !== updatedBlocked.join("|");
        });

      const teacherSaves = teacherIdsToSave.map((teacherId) => {
        const updated = updatedTeacherLunchTimes.find(
          (tlt) =>
            tlt.teacherId === teacherId && tlt.dayOfWeek === dayOfWeek,
        )!;
        return saveTeacherLunchTimes(
          currentSchoolYear.id.toString(),
          teacherId,
          [updated],
        );
      });

      await Promise.all([...gradeSaves, ...teacherSaves]);

      const updatedSchoolYear = {
        ...currentSchoolYear,
        gradeLunchTimes: updatedGradeLunchTimes,
        teacherLunchTimes: updatedTeacherLunchTimes,
      };

      setSchoolYears(
        schoolYears.map((sy) =>
          sy.id === updatedSchoolYear.id ? updatedSchoolYear : sy,
        ),
      );
      setCurrentSchoolYear(updatedSchoolYear);
      setSnackbarMsg("Blocked lunch times saved");
      onClose();
    } catch (error) {
      const axiosError = error as AxiosError;
      setSnackbarErrorMsg(
        "Error saving blocked lunch times: " +
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
        Block Ordering
        <Typography variant="body2" color="text.secondary">
          {DateTimeUtils.toString(
            DateTimeUtils.toDate(date),
            DateTimeFormat.SHORT_DAY_OF_WEEK_DESC,
          )}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {gradeLunchTimesForDay.length === 0 &&
        teacherLunchTimesForDay.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No grade or teacher lunch times are configured for this day.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {gradeLunchTimesForDay.length > 0 && (
              <Stack spacing={0.5}>
                <Typography variant="subtitle2" color="text.secondary">
                  Grade lunch times
                </Typography>
                <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.5}>
                  {gradeLunchTimesForDay.map((glt: GradeLunchTime) => (
                    <FormControlLabel
                      key={`grade-${glt.grade}`}
                      sx={{ mr: 1, ml: 0 }}
                      control={
                        <Checkbox
                          size="small"
                          sx={{ py: 0.25 }}
                          checked={blockedGrades.includes(glt.grade)}
                          onChange={() => handleToggleGrade(glt.grade)}
                        />
                      }
                      label={
                        <Typography
                          variant="body2"
                          sx={{ textWrap: "nowrap" }}
                        >
                          {getGradeName(glt.grade)}
                        </Typography>
                      }
                    />
                  ))}
                </Stack>
              </Stack>
            )}
            {teacherLunchTimesForDay.length > 0 && (
              <Stack spacing={0.5}>
                <Typography variant="subtitle2" color="text.secondary">
                  Teacher lunch times
                </Typography>
                <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.5}>
                  {teacherLunchTimesForDay.map((tlt: TeacherLunchTime) => (
                    <FormControlLabel
                      key={`teacher-${tlt.teacherId}`}
                      sx={{
                        mr: 0,
                        ml: 0,
                        width: 160,
                        overflow: "hidden",
                      }}
                      control={
                        <Checkbox
                          size="small"
                          sx={{ py: 0.25 }}
                          checked={blockedTeacherIds.includes(tlt.teacherId)}
                          onChange={() => handleToggleTeacher(tlt.teacherId)}
                        />
                      }
                      label={
                        <Typography
                          variant="body2"
                          noWrap
                          title={getTeacherName(tlt.teacherId)}
                        >
                          {getTeacherName(tlt.teacherId)}
                        </Typography>
                      }
                    />
                  ))}
                </Stack>
              </Stack>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BlockedLunchTimesDialog;
