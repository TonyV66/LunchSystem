import React from 'react';
import {
  Box,
} from '@mui/material';
import SchoolYear from '../../models/SchoolYear';
import TeacherLunchTimesTable from './TeacherLunchTimesTable';

interface ClassroomLunchtimesTabProps {
  schoolYear: SchoolYear;
}

const ClassroomLunchtimesTab: React.FC<ClassroomLunchtimesTabProps> = ({
  schoolYear,
}) => {
  return (
    <Box>
      <TeacherLunchTimesTable schoolYear={schoolYear} />
    </Box>
  );
};

export default ClassroomLunchtimesTab; 