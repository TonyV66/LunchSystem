import csv from "csv-parser";
import { randomUUID } from "crypto";
import { Readable } from "stream";
import { AppDataSource } from "../data-source";
import SchoolEntity from "../entity/SchoolEntity";
import SchoolYearEntity from "../entity/SchoolYearEntity";
import StudentEntity from "../entity/StudentEntity";
import UserEntity from "../entity/UserEntity";
import { AccountStatus, isFactsUserRole, Role } from "../models/User";
import { ensureEnrollment } from "../utils/EnrollmentUtils";
import {
  createUserWithStatus,
  ensureUserStatus,
} from "../utils/UserStatusUtils";

const STAFF_REQUIRED_HEADERS = ["email", "firstname", "lastname"] as const;
const STUDENT_REQUIRED_HEADERS = ["firstname", "lastname", "email"] as const;
const FACTS_USER_ROLES = [Role.PARENT, Role.TEACHER, Role.STAFF] as const;

const VALID_ROLES = ["staff", "teacher"] as const;

type StaffCsvRole = (typeof VALID_ROLES)[number];

const ROLE_PRIORITY: Record<number, number> = {
  [Role.PARENT]: 1,
  [Role.STAFF]: 2,
  [Role.TEACHER]: 3,
};

export type CsvImportRowError = {
  row: number;
  message: string;
};

export type StaffCsvImportResult = {
  createdUsersCount: number;
  updatedUsersCount: number;
  unchangedUsersCount: number;
  rowErrors: CsvImportRowError[];
};

export type StudentCsvImportResult = {
  createdUsersCount: number;
  createdStudentsCount: number;
  matchedStudentsCount: number;
  enrollmentLinksCount: number;
  rowErrors: CsvImportRowError[];
};

type ParsedStaffCsvRow = {
  rowNumber: number;
  email: string;
  firstName: string;
  lastName: string;
  roleRaw: string;
};

type StaffRecord = {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  sourceRowNumbers: number[];
};

type ParsedStudentCsvRow = {
  rowNumber: number;
  firstName: string;
  lastName: string;
  email: string;
  altEmail: string;
};

export class CsvImportValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CsvImportValidationError";
  }
}

const normalizeHeader = (header: string): string =>
  header.trim().toLowerCase().replace(/[\s_]+/g, "");

const normalizeEmail = (value: string): string => value.trim().toLowerCase();

const normalizeName = (value: string): string => value.trim();

const looksLikeEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const isValidRole = (value: string): value is StaffCsvRole =>
  (VALID_ROLES as readonly string[]).includes(value);

const csvRoleToRole = (role: StaffCsvRole): Role =>
  role === "teacher" ? Role.TEACHER : Role.STAFF;

const higherRole = (a: Role, b: Role): Role =>
  (ROLE_PRIORITY[a] ?? 0) >= (ROLE_PRIORITY[b] ?? 0) ? a : b;

const canElevateFrom = (role: Role): boolean =>
  role === Role.PARENT || role === Role.STAFF;

const parseCsvRows = async <T>(
  buffer: Buffer,
  requiredHeaders: readonly string[],
  expectedHeaderMessage: string,
  mapRow: (raw: Record<string, string>, rowNumber: number) => T,
): Promise<T[]> => {
  const rows: T[] = [];
  let headersValidated = false;
  let rowNumber = 1;

  const validateHeaders = (headers: string[]) => {
    const missing = requiredHeaders.filter(
      (required) => !headers.includes(required),
    );
    if (missing.length > 0) {
      throw new CsvImportValidationError(
        `Missing required columns: ${missing.join(", ")}. Expected header: ${expectedHeaderMessage}`,
      );
    }
    headersValidated = true;
  };

  await new Promise<void>((resolve, reject) => {
    Readable.from(buffer)
      .pipe(
        csv({
          mapHeaders: ({ header }) => normalizeHeader(header),
        }),
      )
      .on("headers", (headers: string[]) => {
        try {
          validateHeaders(headers);
        } catch (error) {
          reject(error);
        }
      })
      .on("data", (raw: Record<string, string>) => {
        try {
          if (!headersValidated) {
            validateHeaders(Object.keys(raw));
          }
          rowNumber += 1;
          rows.push(mapRow(raw, rowNumber));
        } catch (error) {
          reject(error);
        }
      })
      .on("end", () => resolve())
      .on("error", (error) => reject(error));
  });

  return rows;
};

const resolveStaffRow = (
  row: ParsedStaffCsvRow,
): { record: Omit<StaffRecord, "sourceRowNumbers"> } | { error: string } => {
  if (!row.email) {
    return { error: "email is required" };
  }
  if (!looksLikeEmail(row.email)) {
    return { error: `Invalid email "${row.email}"` };
  }
  if (!row.firstName || !row.lastName) {
    return { error: "firstName and lastName are required" };
  }

  let role: Role = Role.STAFF;
  if (row.roleRaw) {
    if (!isValidRole(row.roleRaw)) {
      return {
        error: `Invalid role "${row.roleRaw}". Must be teacher or staff`,
      };
    }
    role = csvRoleToRole(row.roleRaw);
  }

  return {
    record: {
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      role,
    },
  };
};

/**
 * Match users by username/email only when they have parent, teacher, or staff
 * at the school (admins/principals/etc. are never treated as parent/staff matches).
 */
const findFactsRoleUserByUsername = async (
  username: string,
  schoolId: number,
): Promise<UserEntity | null> => {
  return AppDataSource.getRepository(UserEntity)
    .createQueryBuilder("user")
    .innerJoinAndSelect("user.userStatuses", "userStatus")
    .innerJoinAndSelect("userStatus.school", "school")
    .where("LOWER(user.userName) = :username", { username })
    .andWhere("school.id = :schoolId", { schoolId })
    .andWhere("userStatus.role IN (:...roles)", {
      roles: [...FACTS_USER_ROLES],
    })
    .getOne();
};

const ensureParentForSchool = async (
  email: string,
  school: SchoolEntity,
  emailToUser: Map<string, UserEntity>,
): Promise<{ user: UserEntity; created: boolean }> => {
  const cached = emailToUser.get(email);
  if (cached) {
    const statusAtSchool = cached.userStatuses?.find(
      (status) =>
        status.school?.id === school.id && isFactsUserRole(status.role),
    );
    if (!statusAtSchool) {
      await ensureUserStatus(cached, school, { role: Role.PARENT });
    }
    return { user: cached, created: false };
  }

  let user = await findFactsRoleUserByUsername(email, school.id);
  if (!user) {
    const existingByUserName = await AppDataSource.getRepository(
      UserEntity,
    ).findOne({ where: { userName: email } });
    if (existingByUserName) {
      throw new Error(
        `Email "${email}" matches an existing account that is not a parent, teacher, or staff`,
      );
    }
    user = await createUserWithStatus({
      id: undefined,
      userName: email,
      email,
      firstName: "",
      lastName: "",
      name: "",
      phone: "",
      pwd: "",
      school,
      role: Role.PARENT,
      accountStatus: AccountStatus.PENDING,
    });
    emailToUser.set(email, user);
    return { user, created: true };
  }

  const statusAtSchool = user.userStatuses?.find(
    (status) =>
      status.school?.id === school.id && isFactsUserRole(status.role),
  );
  if (!statusAtSchool) {
    await ensureUserStatus(user, school, { role: Role.PARENT });
  }
  emailToUser.set(email, user);
  return { user, created: false };
};

export const findMatchingStudentByNameAndParents = async (
  school: SchoolEntity,
  firstName: string,
  lastName: string,
  parentEmails: string[],
  options?: { requireNullFactsId?: boolean },
): Promise<StudentEntity | null> => {
  if (parentEmails.length === 0) {
    return null;
  }

  const schoolWithDistrict = await AppDataSource.getRepository(
    SchoolEntity,
  ).findOne({
    where: { id: school.id },
    relations: { schoolDistrict: true },
  });
  const districtId = schoolWithDistrict?.schoolDistrict?.id;

  const qb = AppDataSource.getRepository(StudentEntity)
    .createQueryBuilder("student")
    .innerJoin("student.enrollments", "enrollment")
    .innerJoin("enrollment.user", "user")
    .innerJoin("user.userStatuses", "userStatus")
    .innerJoin("userStatus.school", "parentStatusSchool")
    .innerJoin("student.school", "school")
    .where("LOWER(student.firstName) = LOWER(:firstName)", { firstName })
    .andWhere("LOWER(student.lastName) = LOWER(:lastName)", { lastName })
    .andWhere("LOWER(user.userName) IN (:...parentEmails)", {
      parentEmails,
    })
    .andWhere("userStatus.role IN (:...roles)", {
      roles: [...FACTS_USER_ROLES],
    });

  if (options?.requireNullFactsId) {
    qb.andWhere("student.factsId IS NULL");
  }

  if (districtId) {
    qb.andWhere("school.schoolDistrictId = :districtId", { districtId }).andWhere(
      "parentStatusSchool.schoolDistrictId = :districtId",
      { districtId },
    );
  } else {
    qb.andWhere("school.id = :schoolId", { schoolId: school.id }).andWhere(
      "parentStatusSchool.id = :schoolId",
      { schoolId: school.id },
    );
  }

  return qb.getOne();
};

/**
 * Import staff/teachers from CSV.
 * Columns: email, firstName, lastName (required); role optional (teacher|staff, default staff).
 * Elevates parent→staff→teacher only; never downgrades; does not change enrollments or existing user profile fields.
 */
export const importStaffFromCsv = async (
  buffer: Buffer,
  school: SchoolEntity,
): Promise<StaffCsvImportResult> => {
  const rows = await parseCsvRows(
    buffer,
    STAFF_REQUIRED_HEADERS,
    "email,firstName,lastName (role optional)",
    (raw, rowNumber) => ({
      rowNumber,
      email: normalizeEmail(raw.email ?? ""),
      firstName: normalizeName(raw.firstname ?? ""),
      lastName: normalizeName(raw.lastname ?? ""),
      roleRaw: (raw.role ?? "").trim().toLowerCase(),
    }),
  );
  if (rows.length === 0) {
    throw new CsvImportValidationError("CSV file contains no data rows");
  }

  const result: StaffCsvImportResult = {
    createdUsersCount: 0,
    updatedUsersCount: 0,
    unchangedUsersCount: 0,
    rowErrors: [],
  };

  const staffMap = new Map<string, StaffRecord>();

  for (const row of rows) {
    const resolved = resolveStaffRow(row);
    if ("error" in resolved) {
      result.rowErrors.push({ row: row.rowNumber, message: resolved.error });
      continue;
    }

    const existing = staffMap.get(resolved.record.email);
    if (!existing) {
      staffMap.set(resolved.record.email, {
        ...resolved.record,
        sourceRowNumbers: [row.rowNumber],
      });
    } else {
      existing.role = higherRole(existing.role, resolved.record.role);
      existing.sourceRowNumbers.push(row.rowNumber);
    }
  }

  for (const staff of staffMap.values()) {
    const user = await findFactsRoleUserByUsername(
      staff.email,
      school.id,
    );

    if (!user) {
      const existingByUserName = await AppDataSource.getRepository(
        UserEntity,
      ).findOne({ where: { userName: staff.email } });
      if (existingByUserName) {
        // Username taken by a non-FACTS-role account; do not reuse it.
        result.unchangedUsersCount++;
        continue;
      }
      const fullName = `${staff.firstName} ${staff.lastName}`.trim();
      await createUserWithStatus({
        id: undefined,
        userName: staff.email,
        email: staff.email,
        firstName: staff.firstName,
        lastName: staff.lastName,
        name: fullName,
        phone: "",
        pwd: "",
        school,
        role: staff.role,
        accountStatus: AccountStatus.PENDING,
      });
      result.createdUsersCount++;
      continue;
    }

    const existingStatus = user.userStatuses?.find(
      (status) => status.school?.id === school.id,
    );

    if (!existingStatus) {
      await ensureUserStatus(user, school, { role: staff.role });
      result.updatedUsersCount++;
      continue;
    }

    if (!canElevateFrom(existingStatus.role)) {
      result.unchangedUsersCount++;
      continue;
    }

    const roleToApply = higherRole(existingStatus.role, staff.role);
    if (roleToApply === existingStatus.role) {
      result.unchangedUsersCount++;
      continue;
    }

    await ensureUserStatus(user, school, { role: roleToApply });
    result.updatedUsersCount++;
  }

  return result;
};

/**
 * Import students (and ensure parents) from CSV.
 * Columns: firstName, lastName, email (required); altEmail optional.
 * email/altEmail are parent emails. Match students by name + parent within district.
 */
export const importStudentsFromCsv = async (
  buffer: Buffer,
  school: SchoolEntity,
  schoolYear: SchoolYearEntity,
): Promise<StudentCsvImportResult> => {
  const rows = await parseCsvRows(
    buffer,
    STUDENT_REQUIRED_HEADERS,
    "firstName,lastName,email (altEmail optional)",
    (raw, rowNumber): ParsedStudentCsvRow => ({
      rowNumber,
      firstName: normalizeName(raw.firstname ?? ""),
      lastName: normalizeName(raw.lastname ?? ""),
      email: normalizeEmail(raw.email ?? ""),
      altEmail: normalizeEmail(raw.altemail ?? ""),
    }),
  );
  if (rows.length === 0) {
    throw new CsvImportValidationError("CSV file contains no data rows");
  }

  const result: StudentCsvImportResult = {
    createdUsersCount: 0,
    createdStudentsCount: 0,
    matchedStudentsCount: 0,
    enrollmentLinksCount: 0,
    rowErrors: [],
  };

  const studentRepository = AppDataSource.getRepository(StudentEntity);
  const emailToUser = new Map<string, UserEntity>();

  for (const row of rows) {
    try {
      if (!row.firstName || !row.lastName) {
        throw new Error("firstName and lastName are required");
      }

      const parentEmails = [
        ...new Set([row.email, row.altEmail].filter(Boolean)),
      ];
      if (parentEmails.length === 0) {
        throw new Error("At least one of email or altEmail is required");
      }
      for (const parentEmail of parentEmails) {
        if (!looksLikeEmail(parentEmail)) {
          throw new Error(`Invalid parent email "${parentEmail}"`);
        }
      }

      const parents: UserEntity[] = [];
      for (const parentEmail of parentEmails) {
        const { user, created } = await ensureParentForSchool(
          parentEmail,
          school,
          emailToUser,
        );
        if (created) {
          result.createdUsersCount++;
        }
        parents.push(user);
      }

      const student = await findMatchingStudentByNameAndParents(
        school,
        row.firstName,
        row.lastName,
        parentEmails,
      );

      const fullName = `${row.firstName} ${row.lastName}`.trim();
      let savedStudent: StudentEntity;
      if (student) {
        student.school = school;
        savedStudent = await studentRepository.save(student);
        result.matchedStudentsCount++;
      } else {
        savedStudent = await studentRepository.save({
          id: undefined,
          studentId: randomUUID(),
          firstName: row.firstName,
          lastName: row.lastName,
          name: fullName,
          birthDate: "",
          school,
        });
        result.createdStudentsCount++;
      }

      for (const parent of parents) {
        await ensureEnrollment(parent, savedStudent, schoolYear);
        result.enrollmentLinksCount++;
      }
    } catch (error) {
      result.rowErrors.push({
        row: row.rowNumber,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return result;
};
