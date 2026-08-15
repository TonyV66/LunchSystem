import { In } from "typeorm";
import { AppDataSource } from "../data-source";
import EnrollmentEntity from "../entity/EnrollmentEntity";
import SchoolEntity from "../entity/SchoolEntity";
import SchoolYearEntity from "../entity/SchoolYearEntity";
import StudentEntity from "../entity/StudentEntity";
import UserEntity from "../entity/UserEntity";

/**
 * Deactivate active enrollments for a student at other schools in the same
 * school district. No-op if the target school has no district.
 */
export const deactivateEnrollmentsAtOtherDistrictSchools = async (
  studentId: number,
  schoolId: number,
): Promise<void> => {
  const school = await AppDataSource.getRepository(SchoolEntity).findOne({
    where: { id: schoolId },
    relations: { schoolDistrict: true },
  });
  const districtId = school?.schoolDistrict?.id;
  if (!districtId) {
    return;
  }

  const enrollmentRepository = AppDataSource.getRepository(EnrollmentEntity);
  const otherEnrollments = await enrollmentRepository
    .createQueryBuilder("enrollment")
    .innerJoin("enrollment.schoolYear", "schoolYear")
    .innerJoin("schoolYear.school", "school")
    .where("enrollment.studentId = :studentId", { studentId })
    .andWhere("enrollment.active = true")
    .andWhere("school.id != :schoolId", { schoolId })
    .andWhere("school.schoolDistrictId = :districtId", { districtId })
    .getMany();

  if (otherEnrollments.length === 0) {
    return;
  }

  await enrollmentRepository.update(
    { id: In(otherEnrollments.map((enrollment) => enrollment.id)) },
    { active: false },
  );
};

export const deactivateEnrollmentsAtOtherDistrictSchoolsForStudents = async (
  studentIds: number[],
  schoolId: number,
): Promise<void> => {
  const uniqueStudentIds = [...new Set(studentIds)];
  for (const studentId of uniqueStudentIds) {
    await deactivateEnrollmentsAtOtherDistrictSchools(studentId, schoolId);
  }
};

/**
 * Bulk upsert enrollments by (userId, studentId, schoolYearId).
 */
export const upsertEnrollmentLinks = async (
  links: Array<{
    userId: number;
    studentId: number;
    schoolYearId: number;
    active?: boolean;
  }>,
): Promise<void> => {
  if (links.length === 0) {
    return;
  }

  await AppDataSource.createQueryBuilder()
    .insert()
    .into(EnrollmentEntity)
    .values(
      links.map((link) => ({
        userId: link.userId,
        studentId: link.studentId,
        schoolYearId: link.schoolYearId,
        active: link.active ?? true,
      })),
    )
    .orUpdate(["active"], ["userId", "studentId", "schoolYearId"])
    .execute();
};

export const ensureEnrollment = async (
  user: UserEntity | { id: number },
  student: StudentEntity | { id: number },
  schoolYear: SchoolYearEntity | { id: number },
): Promise<EnrollmentEntity> => {
  const enrollmentRepository = AppDataSource.getRepository(EnrollmentEntity);

  let schoolId: number | undefined = (schoolYear as SchoolYearEntity).school
    ?.id;
  if (!schoolId) {
    const yearEntity = await AppDataSource.getRepository(
      SchoolYearEntity,
    ).findOne({
      where: { id: schoolYear.id },
      relations: { school: true },
    });
    schoolId = yearEntity?.school?.id;
  }
  if (schoolId) {
    await deactivateEnrollmentsAtOtherDistrictSchools(student.id, schoolId);
  }

  const existing = await enrollmentRepository.findOne({
    where: {
      user: { id: user.id },
      student: { id: student.id },
      schoolYear: { id: schoolYear.id },
    },
    relations: { user: true, student: true, schoolYear: true },
  });
  if (existing) {
    if (!existing.active) {
      existing.active = true;
      return enrollmentRepository.save(existing);
    }
    return existing;
  }
  return enrollmentRepository.save({
    user: { id: user.id } as UserEntity,
    student: { id: student.id } as StudentEntity,
    schoolYear: { id: schoolYear.id } as SchoolYearEntity,
    active: true,
  });
};

export const removeEnrollment = async (
  user: UserEntity | { id: number },
  student: StudentEntity | { id: number },
  schoolYear: SchoolYearEntity | { id: number },
): Promise<void> => {
  await AppDataSource.getRepository(EnrollmentEntity).update(
    {
      user: { id: user.id },
      student: { id: student.id },
      schoolYear: { id: schoolYear.id },
    },
    { active: false },
  );
};

// TODO: How to handle unenrollments?
export const getStudentsForUserInSchoolYear = async (
  userId: number,
  schoolYearId: number,
): Promise<StudentEntity[]> => {
  if (!schoolYearId) {
    return [];
  }
  return AppDataSource.getRepository(StudentEntity)
    .createQueryBuilder("student")
    .innerJoin(
      "student.enrollments",
      "enrollment",
      "enrollment.userId = :userId AND enrollment.schoolYearId = :schoolYearId AND enrollment.active = true",
      { userId, schoolYearId },
    )
    .leftJoinAndSelect(
      "student.enrollments",
      "yearEnrollment",
      "yearEnrollment.schoolYearId = :schoolYearId AND yearEnrollment.active = true",
      { schoolYearId },
    )
    .leftJoinAndSelect("yearEnrollment.user", "parent")
    .getMany();
};

export const getEnrolledStudentsForSchoolYear = async (
  schoolYearId: number,
): Promise<StudentEntity[]> => {
  if (!schoolYearId) {
    return [];
  }
  return AppDataSource.getRepository(StudentEntity)
    .createQueryBuilder("student")
    .innerJoin(
      "student.enrollments",
      "enrollment",
      "enrollment.schoolYearId = :schoolYearId AND enrollment.active = true",
      { schoolYearId },
    )
    .leftJoinAndSelect(
      "student.enrollments",
      "yearEnrollment",
      "yearEnrollment.schoolYearId = :schoolYearId AND yearEnrollment.active = true",
      { schoolYearId },
    )
    .leftJoinAndSelect("yearEnrollment.user", "parent")
    .distinct(true)
    .getMany();
};

export const getUsersWithEnrollmentsInSchoolYear = async (
  schoolYearId: number,
): Promise<UserEntity[]> => {
  if (!schoolYearId) {
    return [];
  }
  return AppDataSource.getRepository(UserEntity)
    .createQueryBuilder("user")
    .innerJoin(
      "user.enrollments",
      "enrollment",
      "enrollment.schoolYearId = :schoolYearId AND enrollment.active = true",
      { schoolYearId },
    )
    .leftJoinAndSelect("user.userStatuses", "userStatuses")
    .leftJoinAndSelect("userStatuses.school", "school")
    .distinct(true)
    .getMany();
};
