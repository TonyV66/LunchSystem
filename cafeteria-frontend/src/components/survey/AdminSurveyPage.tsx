import React, { useEffect, useState } from "react";
import {
  Button,
  Divider,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Box,
  TextField,
  Typography,
} from "@mui/material";
import { Star, StarBorder, StarHalf } from "@mui/icons-material";
import { endSurvey, getSurvey, startSurvey } from "../../api/CafeteriaClient";
import { Survey } from "../../models/Survey";
import { green } from "@mui/material/colors";
import ConfirmDialog from "../ConfirmDialog";

const AdminSurveyPage: React.FC = () => {
  const [survey, setSurvey] = useState<Survey>({
    id: 0,
    active: false,
    comments: [],
    questions: [
      {
        id: 0,
        questionText: "",
        order: 0,
        oneStarCount: 0,
        twoStarCount: 0,
        threeStarCount: 0,
        fourStarCount: 0,
        fiveStarCount: 0,
        isAgreeDisagree: false,
      },
      {
        id: 1,
        questionText: "",
        order: 1,
        oneStarCount: 0,
        twoStarCount: 0,
        threeStarCount: 0,
        fourStarCount: 0,
        fiveStarCount: 0,
        isAgreeDisagree: false,
      },
      {
        id: 2,
        questionText: "",
        order: 2,
        oneStarCount: 0,
        twoStarCount: 0,
        threeStarCount: 0,
        fourStarCount: 0,
        fiveStarCount: 0,
        isAgreeDisagree: false,
      },
      {
        id: 3,
        questionText: "",
        order: 3,
        oneStarCount: 0,
        twoStarCount: 0,
        threeStarCount: 0,
        fourStarCount: 0,
        fiveStarCount: 0,
        isAgreeDisagree: false,
      },
      {
        id: 4,
        questionText: "",
        order: 4,
        oneStarCount: 0,
        twoStarCount: 0,
        threeStarCount: 0,
        fourStarCount: 0,
        fiveStarCount: 0,
        isAgreeDisagree: false,
      },
    ],
  });

  const [loading, setLoading] = useState(true);
  const [showEndSurveyDialog, setShowEndSurveyDialog] = useState(false);

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        setLoading(true);
        const fetchedSurvey = await getSurvey();
        while (fetchedSurvey.questions.length < 5) {
          fetchedSurvey.questions.push({
            id: -1,
            questionText: "",
            order: fetchedSurvey.questions.length + 1,
            oneStarCount: 0,
            twoStarCount: 0,
            threeStarCount: 0,
            fourStarCount: 0,
            fiveStarCount: 0,
            isAgreeDisagree: false,
          });
        }

        setSurvey(fetchedSurvey);
      } catch (error) {
        console.error("Error fetching survey:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSurvey();
  }, []);

  if (loading) {
    return (
      <Box p={2}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  const handleQuestionTextChange = (index: number, text: string) => {
    setSurvey({
      ...survey,
      questions: survey.questions.map((q, i) =>
        i === index ? { ...q, questionText: text } : q
      ),
    });
  };

  const handleResponseTypeChange = (
    index: number,
    isAgreeDisagree: boolean
  ) => {
    setSurvey({
      ...survey,
      questions: survey.questions.map((q, i) =>
        i === index ? { ...q, isAgreeDisagree: isAgreeDisagree } : q
      ),
    });
  };

  const handleStartSurvey = async () => {
    const newSurvey = await startSurvey(
      survey.questions
        .filter((q) => q.questionText.trim() !== "")
        .map((q) => ({
          questionText: q.questionText,
          isAgreeDisagree: q.isAgreeDisagree,
        }))
    );
    setSurvey(newSurvey as Survey);
  };

  const handleEndSurveyClick = () => {
    setShowEndSurveyDialog(true);
  };

  const handleConfirmEndSurvey = async () => {
    setShowEndSurveyDialog(false);
    const newSurvey = await endSurvey();
    // TODO: If the survey has less than 5 questions, add 5 empty questions
    let id =
      newSurvey.questions.map((q) => q.id).reduce((a, b) => Math.max(a, b), 0) +
      1;

    while (newSurvey.questions.length < 5) {
      newSurvey.questions.push({
        id: id++,
        questionText: "",
        order: newSurvey.questions.length + 1,
        oneStarCount: 0,
        twoStarCount: 0,
        threeStarCount: 0,
        fourStarCount: 0,
        fiveStarCount: 0,
        isAgreeDisagree: false,
      });
    }
    setSurvey(newSurvey as Survey);
  };

  const calculateAverageRating = (question: {
    oneStarCount: number;
    twoStarCount: number;
    threeStarCount: number;
    fourStarCount: number;
    fiveStarCount: number;
  }): number => {
    const totalCount =
      question.oneStarCount +
      question.twoStarCount +
      question.threeStarCount +
      question.fourStarCount +
      question.fiveStarCount;

    if (totalCount === 0) {
      return 0;
    }

    const weightedSum =
      1 * question.oneStarCount +
      2 * question.twoStarCount +
      3 * question.threeStarCount +
      4 * question.fourStarCount +
      5 * question.fiveStarCount;

    const average = weightedSum / totalCount;
    return Math.round(average * 2) / 2; // Round to nearest 0.5
  };

  const renderAverageStars = (average: number) => {
    return [1, 2, 3, 4, 5].map((starValue) => {
      if (average >= starValue) {
        return (
          <Star
            key={starValue}
            sx={{
              color: green[100],
              fontSize: "4rem",
            }}
          />
        );
      } else if (average >= starValue - 0.5) {
        return (
          <StarHalf
            key={starValue}
            sx={{
              color: green[100],
              fontSize: "4rem",
            }}
          />
        );
      } else {
        return (
          <StarBorder
            key={starValue}
            sx={{
              color: green[100],
              fontSize: "4rem",
            }}
          />
        );
      }
    });
  };

  return (
    <Stack p={4} mb={4} direction="column" gap={3}>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="h5">Survey</Typography>
        {survey.active ? (
          <Button
            onClick={handleEndSurveyClick}
            variant="contained"
            color="primary"
          >
            End Survey
          </Button>
        ) : (
          <Button
            onClick={handleStartSurvey}
            disabled={survey.questions.every(
              (q) => q.questionText.trim() === ""
            )}
            variant="contained"
            color="primary"
          >
            Start Survey
          </Button>
        )}
      </Stack>

      {!survey.active && (
        <Box>
          <Typography variant="body1" fontWeight="bold">How To Start a Survey</Typography>
          <Typography variant="body2">1. Enter up to 5 questions.</Typography>
          <Typography variant="body2">2. Choose whether the user responds with &quot;Agree/Disagree&quot; or &quot;Satisfied/Dissatisfied&quot;.</Typography>
          <Typography variant="body2">3. Click the &quot;Start Survey&quot; button to start the survey.</Typography>
          <Typography variant="body2">4. A dialog will appear over the menu calendar, giving the user the option to respond to the survey.</Typography>
          <Typography variant="body2" mb={2}>5. Return to this page to view the survey results.</Typography>
        </Box>
      )}
      {survey.questions
        .filter((q) => !survey.active || q.questionText.trim() !== "")
        .map((question, index) => (
          <>
            {survey.active && index !== 0 && <Divider sx={{ mb: 2 }} />}
            <Stack key={index} alignItems="stretch">
              <TextField
                key={index}
                label={`Question ${index + 1}`}
                variant="outlined"
                disabled={survey.active}
                fullWidth
                value={question.questionText}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  handleQuestionTextChange(index, event.target.value);
                }}
              />
              {!survey.active && (
                <Stack direction="row" gap={2} alignItems="center">
                  <Typography variant="body1" fontWeight="bold">
                    Response Type:
                  </Typography>
                  <RadioGroup
                    row
                    value={question.isAgreeDisagree ? "agree" : "good"}
                    onChange={(event) =>
                      handleResponseTypeChange(
                        index,
                        event.target.value === "agree"
                      )
                    }
                  >
                    <FormControlLabel
                      value="agree"
                      control={<Radio size="small" />}
                      label="Agree/Disagree"
                    />
                    <FormControlLabel
                      value="good"
                      control={<Radio size="small" />}
                      label="Satisfied/Dissatisfied"
                    />
                  </RadioGroup>
                </Stack>
              )}
              {survey.active && (
                <Stack direction="row" justifyContent="space-between">
                  <Stack>
                    <Typography
                      align="center"
                      color="text.secondary"
                      variant="h6"
                      fontWeight="bold"
                    >
                      Distribution
                    </Typography>
                    <Stack direction="row">
                      <Box sx={{ position: "relative" }}>
                        <Star
                          sx={{
                            color: green[100],
                            fontSize: "4rem",
                          }}
                        />
                        <Stack
                          sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="caption">
                            {question.oneStarCount}
                          </Typography>
                        </Stack>
                      </Box>
                      <Box sx={{ position: "relative" }}>
                        <Star
                          sx={{
                            color: green[100],
                            fontSize: "4rem",
                          }}
                        />
                        <Stack
                          sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="caption">
                            {question.twoStarCount}
                          </Typography>
                        </Stack>
                      </Box>
                      <Box sx={{ position: "relative" }}>
                        <Star
                          sx={{
                            color: green[100],
                            fontSize: "4rem",
                          }}
                        />
                        <Stack
                          sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="caption">
                            {question.threeStarCount}
                          </Typography>
                        </Stack>
                      </Box>
                      <Box sx={{ position: "relative" }}>
                        <Star
                          sx={{
                            color: green[100],
                            fontSize: "4rem",
                          }}
                        />
                        <Stack
                          sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="caption">
                            {question.fourStarCount}
                          </Typography>
                        </Stack>
                      </Box>
                      <Box sx={{ position: "relative" }}>
                        <Star
                          sx={{
                            color: green[100],
                            fontSize: "4rem",
                          }}
                        />
                        <Stack
                          sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="caption">
                            {question.fiveStarCount}
                          </Typography>
                        </Stack>
                      </Box>
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
                  <Stack>
                    <Typography
                      align="center"
                      color="text.secondary"
                      variant="h6"
                      fontWeight="bold"
                    >
                      Average
                    </Typography>
                    <Stack direction="row">
                      {renderAverageStars(calculateAverageRating(question))}
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
                </Stack>
              )}
            </Stack>
          </>
        ))}
      {survey.active && survey.comments && survey.comments.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" fontWeight="bold">
            Comments
          </Typography>
          <Stack direction="column" gap={2}>
            {survey.comments.map((comment, index) => (
              <Box
                key={index}
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {comment}
                </Typography>
              </Box>
            ))}
          </Stack>
        </>
      )}
      {showEndSurveyDialog && (
        <ConfirmDialog
          open={showEndSurveyDialog}
          title="End Survey"
          onOk={handleConfirmEndSurvey}
          onCancel={() => setShowEndSurveyDialog(false)}
          okLabel="End Survey"
        >
          <Typography>
            All ratings and comments will be deleted. Are you sure you would
            like to proceed?
          </Typography>
        </ConfirmDialog>
      )}
    </Stack>
  );
};

export default AdminSurveyPage;
