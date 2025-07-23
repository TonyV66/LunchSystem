import React from "react";
import {
  FormControl,
  InputLabel,
  MenuItem as MuiMenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import { Role } from "../../models/User";

interface OrderForSelectorProps {
  selectedPersonId: number;
  onPersonSelected: (personId: number) => void;
}

const MY_ID = -1;

const FamilyMemberSelector: React.FC<OrderForSelectorProps> = ({
  selectedPersonId,
  onPersonSelected,
}) => {
  const {user, students} = React.useContext(AppContext);
  return (
    <FormControl id="order-for-selector" variant="standard" sx={{ minWidth: "150px" }}>
      <InputLabel id="order-for-label">Meal For</InputLabel>
      <Select
        labelId="order-for-label"
        id="order-for"
        value={selectedPersonId.toString()}
        label="Student Name"
        onChange={(event: SelectChangeEvent) =>
          onPersonSelected(parseInt(event.target.value as string))
        }
      >
        {!selectedPersonId && (
          <MuiMenuItem disabled={true} key={0} value={"0"}>
            <Typography color="textDisabled">Select a {user.role === Role.PARENT ? "student" : "person"}</Typography>
          </MuiMenuItem>
        )}
        {user.role !== Role.PARENT && (
          <MuiMenuItem color="primary" value={MY_ID.toString()}>
            <Typography color="primary">Me</Typography>
          </MuiMenuItem>
        )}
        {students.filter(student => student.parents.includes(user.id)).map((student) => (
          <MuiMenuItem key={student.id} value={student.id.toString()}>
            {student.firstName + " " + student.lastName}
          </MuiMenuItem>
        ))}
        <MuiMenuItem color="primary" value={"-2"}>
          <Typography color="primary">Add A Student</Typography>
        </MuiMenuItem>
      </Select>
    </FormControl>
  );
};

export default FamilyMemberSelector; 