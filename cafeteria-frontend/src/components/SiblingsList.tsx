import React, { useContext } from "react";
import {
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
  Stack,
  IconButton,
} from "@mui/material";
import { AppContext } from "../AppContextProvider";
import Student from "../models/Student";
import { Edit } from "@mui/icons-material";
import User from "../models/User";

const SiblingsList: React.FC<{user: User}> = ({user}) => {
  const { students } = useContext(AppContext);
  const siblings = students.filter(s => s.parents.includes(user.id))

  if (!siblings || siblings.length === 0) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No children found
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack direction="column">
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography fontWeight="bold" variant="body2">
          Default Pricing
        </Typography>
        <IconButton
          size="small"
          color="primary"
        >
          <Edit />
        </IconButton>
      </Stack>

      <Paper sx={{ p: 2, flexGrow: 1 }}>
        {!siblings?.length ? (
          <Typography variant="body2" color="text.secondary">
            No children found
          </Typography>
        ) : (
          <List dense>
            {siblings.map((child: Student) => (
              <ListItem key={child.id}>
                <ListItemText
                  primary={child.name}
                  secondary={`Student ID: ${child.studentId}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Stack>
  );
};

export default SiblingsList;
