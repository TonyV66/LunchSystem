import React, { useContext } from "react";
import { Tab, Tabs } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { CLASSROOM_URL, FAMILY_URL, STUDENTS_URL, USERS_URL } from "../../MainAppPanel";
import { Role } from "../../models/User";
import { AppContext } from "../../AppContextProvider";

interface PeopleTabsProps {
  value?: string;
}

const PeopleTabs: React.FC<PeopleTabsProps> = ({ value }) => {
    const { user } = useContext(AppContext);

  const navigate = useNavigate();

  const handleTabSelected = (event: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

  return (
    <Tabs
      value={value}
      onChange={handleTabSelected}
      aria-label="secondary tabs example"
    >
      {(user.role === Role.ADMIN || user.role === Role.PRINCIPAL) && <Tab value={USERS_URL} label="Users" />}
      {(user.role === Role.ADMIN || user.role === Role.PRINCIPAL || user.role === Role.CAFETERIA) && <Tab value={STUDENTS_URL} label="Students" />}
      {user.role === Role.TEACHER && <Tab value={CLASSROOM_URL} label="Classroom" />}
      <Tab value={FAMILY_URL} label="Family" />
    </Tabs>
  );
};

export default PeopleTabs;
