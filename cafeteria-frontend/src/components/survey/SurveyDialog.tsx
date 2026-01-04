import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  ToggleButton,
  Typography,
} from "@mui/material";
import { Star, StarBorder } from "@mui/icons-material";
import { submitSurvey } from "../../api/CafeteriaClient";
import { AppContext } from "../../AppContextProvider";
import { useContext } from "react";
import { AxiosError } from "axios";

interface SurveyPageProps {
  onClose: () => void;
}

const SurveyDialog: React.FC<SurveyPageProps> = ({ onClose }) => {
  const { survey, setSurvey, setSnackbarMsg, setSnackbarErrorMsg } =
    useContext(AppContext);
  const [ratings, setRatings] = useState<number[]>([-1, -1, -1, -1, -1]);
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setRatings(new Array(survey!.questions.length).fill(-1));
    setComment("");
  }, [survey]);

  const handleStarClick = (index: number, rating: number) => {
    setRatings(ratings.map((r, i) => (i === index ? rating : r)));
  };

  const handleHelpClick = (index: number) => {
    setRatings(ratings.map((r, i) => (i === index ? 0 : r)));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await submitSurvey(ratings, comment.trim() || undefined);
      setSurvey(null);
      setSnackbarMsg("Thank you for your feedback!");
      onClose();
    } catch (error) {
      const axiosError = error as AxiosError;
      setSnackbarErrorMsg(
        "Error submitting survey: " +
          (axiosError.response?.data?.toString() ??
            axiosError.response?.statusText ??
            "Unknown server error")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    try {
      setSubmitting(true);
      // Submit with all zeros
      const zeroRatings = new Array(survey!.questions.length).fill(0);
      await submitSurvey(zeroRatings);
      setSurvey(null);
      onClose();
    } catch (error) {
      const axiosError = error as AxiosError;
      setSnackbarErrorMsg(
        "Error skipping survey: " +
          (axiosError.response?.data?.toString() ??
            axiosError.response?.statusText ??
            "Unknown server error")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemindMeLater = () => {
    setSurvey(null);
  };

  return (
    <Dialog
      open={true}
      onClose={() => {}}
      maxWidth="md"
      fullWidth
      aria-labelledby="survey-dialog-title"
    >
      <DialogTitle id="survey-dialog-title">A Brief Survey</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>
          Please help us to serve you better. Rate each question from 1 to 5
          stars. Click &quot;No Opinion&quot; to skip a question. You can submit the survey after you have responded to all
          questions.
        </Typography>
        <Stack direction="column" gap={3} sx={{ pt: 1 }}>
          {survey!.questions.map((question, index) => {
            const questionRating = ratings[index];
            return (
              <Box key={index}>
                {index !== 0 && <Divider sx={{ mb: 2 }} />}
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {question.questionText}
                </Typography>
                <Stack direction="row" gap={6}>
                  <Stack>
                    <Stack direction="row" spacing={0.5}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Box
                          key={star}
                          onClick={() => handleStarClick(index, star)}
                          sx={{
                            display: "inline-flex",
                            cursor: "pointer",
                          }}
                        >
                          {questionRating >= 0 && star <= questionRating ? (
                            <Star
                              sx={{
                                color: 'primary.main',
                                fontSize: "2rem",
                              }}
                            />
                          ) : (
                            <StarBorder
                              sx={{
                                color: 'primary.main',
                                fontSize: "2rem",
                              }}
                            />
                          )}
                        </Box>
                      ))}
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      {question.isAgreeDisagree ? (
                        <>
                          <Typography align="left" variant="caption">
                            Strongly
                            <br />
                            Disagree
                          </Typography>
                          <Typography align="right" variant="caption">
                            Strongly
                            <br />
                            Agree
                          </Typography>
                        </>
                      ) : (
                        <>
                          <Typography align="left" variant="caption">
                            Very
                            <br />
                            Dissatisfied
                          </Typography>
                          <Typography align="right" variant="caption">
                            Very
                            <br />
                            Satisfied
                          </Typography>
                        </>
                      )}
                    </Stack>
                  </Stack>
                  <ToggleButton
                    value="skip"
                    color="primary"
                    selected={questionRating === 0}
                    onChange={() => handleHelpClick(index)}
                    size="small"
                    sx={{
                      alignSelf: "center",
                    }}
                  >
                    No Opinion
                  </ToggleButton>
                </Stack>
              </Box>
            );
          })}
        </Stack>
        <Divider sx={{ my: 2 }} />
        <TextField
          label="Additional Comments (Optional)"
          multiline
          rows={4}
          value={comment}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setComment(event.target.value.slice(0, 500))
          }
          helperText={`${comment.length}/500 characters`}
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleSkip}
          disabled={submitting}
          variant="contained"
          color="primary"
        >
          Skip Survey
        </Button>
        <Button
          onClick={handleRemindMeLater}
          disabled={submitting}
          variant="contained"
          color="primary"
        >
          Remind Me Later
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || ratings.some((r) => r === -1)}
          variant="contained"
          color="primary"
        >
          Submit Survey
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SurveyDialog;
