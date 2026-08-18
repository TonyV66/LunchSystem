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

export const getStudentsAssignedToLunchtimeTeacher = async (
  teacherId: number,
  schoolYearId: number,
): Promise<StudentEntity[]> => {
  if (!schoolYearId) {
    return [];
  }
  return AppDataSource.getRepository(StudentEntity)
    .createQueryBuilder("student")
    .innerJoin(
      "student.lunchTimes",
      "lunchTime",
      "lunchTime.schoolYearId = :schoolYearId AND lunchTime.lunchtimeTeacherId = :teacherId",
      { schoolYearId, teacherId },
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

const isMoreRecentEnrollment = (
  candidate: EnrollmentEntity,
  current: EnrollmentEntity,
): boolean => {
  const candidateStart = candidate.schoolYear?.startDate ?? "";
  const currentStart = current.schoolYear?.startDate ?? "";
  if (candidateStart !== currentStart) {
    return candidateStart > currentStart;
  }
  return candidate.schoolYearId > current.schoolYearId;
};

const normalizeStudentName = (value: string): string => value.trim().toLowerCase();

const studentIdentityKeys = (student: StudentEntity): string[] => {
  const keys = [
    `name:${normalizeStudentName(student.firstName)}|${normalizeStudentName(student.lastName)}`,
  ];
  if (student.factsId) {
    keys.push(`facts:${student.factsId}`);
  }
  const externalId = student.studentId?.trim();
  if (externalId && /^\d+$/.test(externalId)) {
    keys.push(`facts:${externalId}`);
  }
  return keys;
};

const mostRecentEnrollmentByPerson = (
  enrollments: EnrollmentEntity[],
): EnrollmentEntity[] => {
  const parentByStudentId = new Map<number, number>();
  const find = (studentId: number): number => {
    const parent = parentByStudentId.get(studentId) ?? studentId;
    if (parent !== studentId) {
      const root = find(parent);
      parentByStudentId.set(studentId, root);
      return root;
    }
    return parent;
  };
  const union = (left: number, right: number) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) {
      parentByStudentId.set(leftRoot, rightRoot);
    }
  };

  const studentsById = new Map<number, StudentEntity>();
  for (const enrollment of enrollments) {
    if (enrollment.student) {
      studentsById.set(enrollment.student.id, enrollment.student);
      parentByStudentId.set(enrollment.student.id, enrollment.student.id);
    }
  }

  const studentIdByKey = new Map<string, number>();
  for (const student of studentsById.values()) {
    for (const key of studentIdentityKeys(student)) {
      const existing = studentIdByKey.get(key);
      if (existing != null) {
        union(existing, student.id);
      } else {
        studentIdByKey.set(key, student.id);
      }
    }
  }

  const mostRecentByPerson = new Map<number, EnrollmentEntity>();
  for (const enrollment of enrollments) {
    const personId = find(enrollment.studentId);
    const existing = mostRecentByPerson.get(personId);
    if (!existing || isMoreRecentEnrollment(enrollment, existing)) {
      mostRecentByPerson.set(personId, enrollment);
    }
  }

  return [...mostRecentByPerson.values()];
};

export const getStudentsWithEnrollmentHistoryForUserAtSchool = async (
  userId: number,
  schoolId: number,
  currentSchoolYearId?: number,
): Promise<StudentEntity[]> => {
  const enrollments = await AppDataSource.getRepository(EnrollmentEntity)
    .createQueryBuilder("enrollment")
    .innerJoinAndSelect("enrollment.student", "student")
    .innerJoinAndSelect("enrollment.schoolYear", "schoolYear")
    .innerJoin("schoolYear.school", "school")
    .where("enrollment.userId = :userId", { userId })
    .andWhere("school.id = :schoolId", { schoolId })
    .getMany();

  const studentIds = mostRecentEnrollmentByPerson(enrollments).map(
    (enrollment) => enrollment.studentId,
  );
  if (studentIds.length === 0) {
    return [];
  }

  const query = AppDataSource.getRepository(StudentEntity)
    .createQueryBuilder("student")
    .whereInIds(studentIds);

  if (currentSchoolYearId) {
    query
      .leftJoinAndSelect(
        "student.enrollments",
        "yearEnrollment",
        "yearEnrollment.schoolYearId = :currentSchoolYearId AND yearEnrollment.active = true",
        { currentSchoolYearId },
      )
      .leftJoinAndSelect("yearEnrollment.user", "parent");
  }

  return query.getMany();
};

const userIdentityKeys = (user: UserEntity): string[] => {
  const firstName = normalizeStudentName(user.firstName);
  const lastName = normalizeStudentName(user.lastName);
  const keys: string[] = [];
  if (firstName && lastName) {
    keys.push(`name:${firstName}|${lastName}`);
  }
  for (const status of user.userStatuses ?? []) {
    if (status.factsId) {
      keys.push(`facts:${status.factsId}`);
    }
  }
  const email = user.email?.trim().toLowerCase();
  if (email) {
    keys.push(`email:${email}`);
  }
  const userName = user.userName?.trim().toLowerCase();
  if (userName?.includes("@")) {
    keys.push(`email:${userName}`);
  }
  return keys;
};

const mostRecentEnrollmentByUserPerson = (
  enrollments: EnrollmentEntity[],
): EnrollmentEntity[] => {
  const parentByUserId = new Map<number, number>();
  const find = (userId: number): number => {
    const parent = parentByUserId.get(userId) ?? userId;
    if (parent !== userId) {
      const root = find(parent);
      parentByUserId.set(userId, root);
      return root;
    }
    return parent;
  };
  const union = (left: number, right: number) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) {
      parentByUserId.set(leftRoot, rightRoot);
    }
  };

  const usersById = new Map<number, UserEntity>();
  for (const enrollment of enrollments) {
    if (enrollment.user) {
      usersById.set(enrollment.user.id, enrollment.user);
      parentByUserId.set(enrollment.user.id, enrollment.user.id);
    }
  }

  const userIdByKey = new Map<string, number>();
  for (const user of usersById.values()) {
    for (const key of userIdentityKeys(user)) {
      const existing = userIdByKey.get(key);
      if (existing != null) {
        union(existing, user.id);
      } else {
        userIdByKey.set(key, user.id);
      }
    }
  }

  const mostRecentByPerson = new Map<number, EnrollmentEntity>();
  for (const enrollment of enrollments) {
    const personId = find(enrollment.userId);
    const existing = mostRecentByPerson.get(personId);
    if (!existing || isMoreRecentEnrollment(enrollment, existing)) {
      mostRecentByPerson.set(personId, enrollment);
    }
  }

  return [...mostRecentByPerson.values()];
};

export const getUsersWithEnrollmentHistoryForStudentAtSchool = async (
  studentId: number,
  schoolId: number,
  currentSchoolYearId?: number,
): Promise<UserEntity[]> => {
  const studentRepository = AppDataSource.getRepository(StudentEntity);
  const student = await studentRepository.findOne({
    where: { id: studentId, school: { id: schoolId } },
  });
  if (!student) {
    return [];
  }

  const schoolStudents = await studentRepository.find({
    where: { school: { id: schoolId } },
  });
  const identityKeys = new Set(studentIdentityKeys(student));
  const relatedStudentIds = schoolStudents
    .filter((candidate) =>
      studentIdentityKeys(candidate).some((key) => identityKeys.has(key)),
    )
    .map((candidate) => candidate.id);
  const studentIds =
    relatedStudentIds.length > 0 ? relatedStudentIds : [studentId];

  const enrollments = await AppDataSource.getRepository(EnrollmentEntity)
    .createQueryBuilder("enrollment")
    .innerJoinAndSelect("enrollment.user", "user")
    .leftJoinAndSelect("user.userStatuses", "historyStatuses")
    .innerJoinAndSelect("enrollment.schoolYear", "schoolYear")
    .innerJoin("schoolYear.school", "school")
    .where("enrollment.studentId IN (:...studentIds)", { studentIds })
    .andWhere("school.id = :schoolId", { schoolId })
    .getMany();

  const userIds = mostRecentEnrollmentByUserPerson(enrollments).map(
    (enrollment) => enrollment.userId,
  );
  if (userIds.length === 0) {
    return [];
  }

  const query = AppDataSource.getRepository(UserEntity)
    .createQueryBuilder("user")
    .leftJoinAndSelect("user.userStatuses", "userStatuses")
    .leftJoinAndSelect("userStatuses.school", "statusSchool")
    .whereInIds(userIds);

  if (currentSchoolYearId) {
    query.leftJoinAndSelect(
      "user.enrollments",
      "yearEnrollment",
      "yearEnrollment.studentId = :studentId AND yearEnrollment.schoolYearId = :currentSchoolYearId AND yearEnrollment.active = true",
      { studentId, currentSchoolYearId },
    );
  }

  return query.getMany();
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
