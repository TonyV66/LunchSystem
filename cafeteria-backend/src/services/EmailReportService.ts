import { AppDataSource } from "../data-source";
import SchoolEntity from "../entity/SchoolEntity";
import SchoolYearEntity from "../entity/SchoolYearEntity";
import UserEntity from "../entity/UserEntity";
import { Role } from "../models/User";
import { sendClassroomReportEmail } from "../utils/EmailUtils";
import { generatePDFBuffer, getClassroomReport } from "../utils/ReportUtils";
import { DateTimeUtils } from "../DateTimeUtils";
import School from "../models/School";
import {
  RelativeDateTarget,
} from "../models/SchoolYear";

export class EmailReportService {
  /**
   * Calculates the target meal date based on email report configuration
   * @param config Email report configuration from school
   * @param currentDate Current date to calculate from
   * @returns The date when the meal will be served
   */
  /**
   * Sends classroom reports to all teachers for a specific date
   * @param school School configuration
   * @param targetDate The date for which to send reports
   */
  static async sendClassroomReports(
    school: SchoolEntity,
    dates: string[]
  ): Promise<void> {
    try {
      // Get current school year by testing the isCurrent field
      const schoolYearRepository =
        AppDataSource.getRepository(SchoolYearEntity);
      const currentSchoolYear = await schoolYearRepository.findOne({
        where: { isCurrent: true },
      });

      if (!currentSchoolYear) {
        console.error("No active school year found");
        return;
      }

      // Get all teachers for this school who have assigned lunch times
      const userRepository = AppDataSource.getRepository(UserEntity);
      const teachers = await userRepository.find({
        where: { 
          role: Role.TEACHER,
          school: { id: school.id }
        },
        relations: { 
          school: true,
          lunchTimes: {
            schoolYear: true
          }
        }
      });

      // Filter teachers to only those with lunch times for the current school year
      const teachersWithLunchTimes = teachers.filter(teacher => 
        teacher.lunchTimes?.some((tlt: any) => tlt.schoolYear.id === currentSchoolYear.id) && teacher.email
      );

      // Send reports to each teacher
      for (const teacher of teachersWithLunchTimes) {
        try {

          // Generate classroom report for this teacher
          const html = await getClassroomReport(
            currentSchoolYear,
            teacher,
            dates
          );

          if (!html) {
            continue;
          }

          // Generate PDF
          const pdfBuffer = await generatePDFBuffer(html);

          // Send email
          const teacherName =
            teacher.name.length > 0
              ? teacher.name
              : `${teacher.firstName} ${teacher.lastName}`;
          await sendClassroomReportEmail(
            teacher.email,
            teacherName,
            DateTimeUtils.toString(dates[0]),
            DateTimeUtils.toString(dates[dates.length - 1]),
            pdfBuffer
          );
        } catch (error) {
        }
      }
    } catch (error) {
      console.error("Error in sendClassroomReportsForDate:", error);
    }
  }

  /**
   * Main function to check if it's time to send reports and send them
   */
  static async checkAndSendReports(schoolId?: number): Promise<void> {
    try {
      // Get school configuration
      const schoolRepository = AppDataSource.getRepository(SchoolEntity);
      let schools = [];
      if (schoolId) {
        const schoolEntity = await schoolRepository.findOne({
          where: { id: schoolId },
        });
        if (schoolEntity) {
          schools.push(schoolEntity);
        }
      } else {
        schools = await schoolRepository.find();
      }

      for (const school of schools) {
        // Check if it's time to send reports in the school's timezone
        const now = new Date();

        // Get current time in school's timezone and round to the hour
        const schoolTime = new Date(
          now.toLocaleString("en-US", {
            timeZone: school.timezone || "America/New_York",
          })
        );

        // Round to the nearest hour
        schoolTime.setMinutes(0);
        schoolTime.setSeconds(0);
        schoolTime.setMilliseconds(0);

        const currentTime = schoolTime.toTimeString().slice(0, 5); // HH:MM format
        const currentDate = DateTimeUtils.toString(schoolTime); // YYYY-MM-DD format

        if (currentTime !== school.emailReportStartTime) {
          continue;
        }

        // Check if school has a current school year
        const schoolYearRepository =
          AppDataSource.getRepository(SchoolYearEntity);
        const currentSchoolYear = await schoolYearRepository.findOne({
          where: {
            school: { id: school.id },
            isCurrent: true,
          },
          relations: { school: true },
        });

        if (!currentSchoolYear) {
          continue;
        }

        // Check if school year end date is in the past
        if (currentSchoolYear.endDate < currentDate) {
          continue;
        }

        const dates: string[] = [];
        const startingDate = DateTimeUtils.addDays(currentDate, school.emailReportStartPeriodCount);

        if (
          school.emailReportStartRelativeTo ===
          RelativeDateTarget.WEEK_MEAL_IS_SERVED
        ) {
          if (startingDate.getDay() !== 0) {
            continue;
          }
          for (let i = 1; i <= 5; i++) {
            dates.push(DateTimeUtils.addDays(startingDate, i).toString());
          }
        } else {
          if (startingDate.getDay() === 0 || startingDate.getDay() === 6) {
            continue;
          }
          dates.push(startingDate.toString());
        }

        await this.sendClassroomReports(school, dates);
      }
    } catch (error) {
      console.error("Error in checkAndSendReports:", error);
    }
  }
}
