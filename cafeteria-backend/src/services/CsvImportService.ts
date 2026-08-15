import { randomUUID } from "crypto";
import csv from "csv-parser";
import { Readable } from "stream";
import { AppDataSource } from "../data-source";
import SchoolEntity from "../entity/SchoolEntity";
import SchoolYearEntity from "../entity/SchoolYearEntity";
import StudentEntity from "../entity/StudentEntity";
import UserEntity from "../entity/UserEntity";
import { AccountStatus, Role } from "../models/User";
import { ensureEnrollment } from "../utils/EnrollmentUtils";
import {
  createUserWithStatus,
  ensureUserStatus,
} from "../utils/UserStatusUtils";

const REQUIRED_HEADERS = [
  "email",
  "firstname",
  "lastname",
  "parent1",
] as const;

const VALID_ROLES = ["student", "parent", "staff", "teacher"] as const;

type CsvRole = (typeof VALID_ROLES)[number];

const ROLE_PRIORITY: Record<number, number> = {
  [Role.PARENT]: 1,
  [Role.STAFF]: 2,
  [Role.TEACHER]: 3,
};

export type CsvImportRowError = {
  row: number;
  message: string;
};

export type CsvImportResult = {
  createdUsersCount: number;
  updatedUsersCount: number;
  createdStudentsCount: number;
  updatedStudentsCount: number;
  enrollmentLinksCount: number;
  rowErrors: CsvImportRowError[];
};

type ParsedCsvRow = {
  rowNumber: number;
  roleRaw: string;
  email: string;
  firstName: string;
  lastName: string;
  parent1: string;
  parent2: string;
};

type ResolvedCsvRow = ParsedCsvRow & {
  role: CsvRole;
};

type AdultRecord = {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  sourceRowNumbers: number[];
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

const isValidRole = (value: string): value is CsvRole =>
  (VALID_ROLES as readonly string[]).includes(value);

const csvRoleToRole = (role: CsvRole): Role => {
  switch (role) {
    case "teacher":
      return Role.TEACHER;
    case "staff":
      return Role.STAFF;
    case "parent":
    default:
      return Role.PARENT;
  }
};

const higherRole = (a: Role, b: Role): Role =>
  (ROLE_PRIORITY[a] ?? 0) >= (ROLE_PRIORITY[b] ?? 0) ? a : b;

const parseCsvBuffer = async (buffer: Buffer): Promise<ParsedCsvRow[]> => {
  const rows: ParsedCsvRow[] = [];
  let headersValidated = false;
  let rowNumber = 1;

  const validateHeaders = (headers: string[]) => {
    const missing = REQUIRED_HEADERS.filter(
      (required) => !headers.includes(required),
    );
    if (missing.length > 0) {
      throw new CsvImportValidationError(
        `Missing required columns: ${missing.join(", ")}. Expected header: email,firstname,lastname,parent1 (role and parent2 optional)`,
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
          rows.push({
            rowNumber,
            roleRaw: (raw.role ?? "").trim().toLowerCase(),
            email: normalizeEmail(raw.email ?? ""),
            firstName: normalizeName(raw.firstname ?? ""),
            lastName: normalizeName(raw.lastname ?? ""),
            parent1: normalizeEmail(raw.parent1 ?? ""),
            parent2: normalizeEmail(raw.parent2 ?? ""),
          });
        } catch (error) {
          reject(error);
        }
      })
      .on("end", () => resolve())
      .on("error", (error) => reject(error));
  });

  return rows;
};

/**
 * Resolve role and validate a row.
 * - role omitted/empty + email → parent
 * - role omitted/empty + no email + parent email → student
 * - both email and parent email → skip
 * - students require at least one parent email
 */
const resolveRow = (
  row: ParsedCsvRow,
): { row: ResolvedCsvRow } | { error: string } | { skip: string } => {
  const hasEmail = Boolean(row.email);
  const hasParent = Boolean(row.parent1 || row.parent2);

  if (hasEmail && hasParent) {
    return {
      skip: "Skipped: row has both an email and a parent email",
    };
  }

  if (!row.firstName || !row.lastName) {
    return { error: "firstname and lastname are required" };
  }

  let role: CsvRole;
  if (row.roleRaw) {
    if (!isValidRole(row.roleRaw)) {
      return {
        error: `Invalid role "${row.roleRaw}". Must be student, parent, staff, or teacher`,
      };
    }
    role = row.roleRaw;
  } else if (hasEmail) {
    role = "parent";
  } else if (hasParent) {
    role = "student";
  } else {
    return {
      error:
        "Unable to determine role: provide an email (parent) or parent1/parent2 (student)",
    };
  }

  if (role === "student") {
    if (!hasParent) {
      return {
        error: "At least one of parent1 or parent2 is required for students",
      };
    }
    if (row.parent1 && !looksLikeEmail(row.parent1)) {
      return { error: "parent1 must be an email address" };
    }
    if (row.parent2 && !looksLikeEmail(row.parent2)) {
      return { error: "parent2 must be an email address" };
    }
  } else {
    if (!hasEmail) {
      return { error: "email is required for non-student roles" };
    }
    if (!looksLikeEmail(row.email)) {
      return { error: `Invalid email "${row.email}"` };
    }
  }

  return { row: { ...row, role } };
};

const findUserByEmailOrUsername = async (
  email: string,
): Promise<UserEntity | null> => {
  const userRepository = AppDataSource.getRepository(UserEntity);
  return userRepository
    .createQueryBuilder("user")
    .leftJoinAndSelect("user.userStatuses", "userStatus")
    .leftJoinAndSelect("userStatus.school", "school")
    .where("LOWER(user.userName) = :email", { email })
    .orWhere("LOWER(user.email) = :email", { email })
    .getOne();
};

const findMatchingStudent = async (
  school: SchoolEntity,
  firstName: string,
  lastName: string,
  parentEmails: string[],
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
    .innerJoin("student.school", "school")
    .where("LOWER(student.firstName) = LOWER(:firstName)", { firstName })
    .andWhere("LOWER(student.lastName) = LOWER(:lastName)", { lastName })
    .andWhere(
      "(LOWER(user.userName) IN (:...parentEmails) OR LOWER(user.email) IN (:...parentEmails))",
      { parentEmails },
    );

  if (districtId) {
    qb.andWhere("school.schoolDistrictId = :districtId", { districtId });
  } else {
    qb.andWhere("school.id = :schoolId", { schoolId: school.id });
  }

  return qb.getOne();
};

export const importUsersFromCsv = async (
  buffer: Buffer,
  school: SchoolEntity,
  schoolYear: SchoolYearEntity,
): Promise<CsvImportResult> => {
  const rows = await parseCsvBuffer(buffer);
  if (rows.length === 0) {
    throw new CsvImportValidationError("CSV file contains no data rows");
  }

  const result: CsvImportResult = {
    createdUsersCount: 0,
    updatedUsersCount: 0,
    createdStudentsCount: 0,
    updatedStudentsCount: 0,
    enrollmentLinksCount: 0,
    rowErrors: [],
  };

  const adultMap = new Map<string, AdultRecord>();
  const validStudentRows: ResolvedCsvRow[] = [];

  for (const row of rows) {
    const resolved = resolveRow(row);
    if ("skip" in resolved) {
      result.rowErrors.push({ row: row.rowNumber, message: resolved.skip });
      continue;
    }
    if ("error" in resolved) {
      result.rowErrors.push({ row: row.rowNumber, message: resolved.error });
      continue;
    }

    const resolvedRow = resolved.row;
    if (resolvedRow.role === "student") {
      validStudentRows.push(resolvedRow);
      continue;
    }

    const role = csvRoleToRole(resolvedRow.role);
    const existing = adultMap.get(resolvedRow.email);
    if (!existing) {
      adultMap.set(resolvedRow.email, {
        email: resolvedRow.email,
        firstName: resolvedRow.firstName,
        lastName: resolvedRow.lastName,
        role,
        sourceRowNumbers: [resolvedRow.rowNumber],
      });
    } else {
      existing.role = higherRole(existing.role, role);
      existing.firstName = resolvedRow.firstName || existing.firstName;
      existing.lastName = resolvedRow.lastName || existing.lastName;
      existing.sourceRowNumbers.push(resolvedRow.rowNumber);
    }
  }

  const userRepository = AppDataSource.getRepository(UserEntity);
  const studentRepository = AppDataSource.getRepository(StudentEntity);
  const emailToUser = new Map<string, UserEntity>();

  for (const adult of adultMap.values()) {
    let user = await findUserByEmailOrUsername(adult.email);
    const fullName = `${adult.firstName} ${adult.lastName}`.trim();

    if (!user) {
      user = await createUserWithStatus({
        id: undefined,
        userName: adult.email,
        email: adult.email,
        firstName: adult.firstName,
        lastName: adult.lastName,
        name: fullName,
        phone: "",
        pwd: "",
        school,
        role: adult.role,
        accountStatus: AccountStatus.PENDING,
      });
      result.createdUsersCount++;
    } else {
      user.firstName = adult.firstName;
      user.lastName = adult.lastName;
      user.name = fullName;
      user.email = adult.email;
      user.userName = adult.email;
      await userRepository.save(user);

      const existingStatus = user.userStatuses?.find(
        (status) => status.school?.id === school.id,
      );
      const existingRole = existingStatus?.role;
      const roleToApply =
        existingRole === Role.TEACHER ||
        existingRole === Role.STAFF ||
        existingRole === Role.PARENT
          ? higherRole(existingRole, adult.role)
          : adult.role;

      await ensureUserStatus(user, school, { role: roleToApply });
      result.updatedUsersCount++;
    }

    emailToUser.set(adult.email, user);
  }

  const resolveParent = async (
    email: string,
  ): Promise<UserEntity | null> => {
    if (!email) {
      return null;
    }
    const fromCsv = emailToUser.get(email);
    if (fromCsv) {
      return fromCsv;
    }
    const fromDb = await findUserByEmailOrUsername(email);
    if (fromDb) {
      emailToUser.set(email, fromDb);
    }
    return fromDb;
  };

  for (const row of validStudentRows) {
    try {
      const parentEmails = [row.parent1, row.parent2].filter(Boolean);
      const parents: UserEntity[] = [];

      for (const parentEmail of parentEmails) {
        const parent = await resolveParent(parentEmail);
        if (!parent) {
          throw new Error(
            `Parent "${parentEmail}" was not found in the CSV or database`,
          );
        }
        const statusAtSchool = parent.userStatuses?.find(
          (status) => status.school?.id === school.id,
        );
        if (!statusAtSchool) {
          await ensureUserStatus(parent, school, { role: Role.PARENT });
        }
        parents.push(parent);
      }

      let student = await findMatchingStudent(
        school,
        row.firstName,
        row.lastName,
        parentEmails,
      );

      const fullName = `${row.firstName} ${row.lastName}`.trim();
      let savedStudent: StudentEntity;
      if (student) {
        student.firstName = row.firstName;
        student.lastName = row.lastName;
        student.name = fullName;
        student.school = school;
        savedStudent = await studentRepository.save(student);
        result.updatedStudentsCount++;
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
