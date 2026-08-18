import axios from "axios";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { DeepPartial, In } from "typeorm";
import { AppDataSource } from "../data-source";
import StudentEntity from "../entity/StudentEntity";
import UserEntity from "../entity/UserEntity";
import SchoolYear from "../models/SchoolYear";
import FactsRelationship from "../models/FactsParent";
import FactsPerson from "../models/FactsPerson";
import SchoolEntity from "../entity/SchoolEntity";
import { Role, AccountStatus, isFactsUserRole } from "../models/User";
import { createUserWithStatus, saveUserStatus } from "../utils/UserStatusUtils";
import EnrollmentEntity from "../entity/EnrollmentEntity";
import SchoolYearEntity from "../entity/SchoolYearEntity";
import {
  deactivateEnrollmentsAtOtherDistrictSchoolsForStudents,
  upsertEnrollmentLinks,
} from "../utils/EnrollmentUtils";
import { findMatchingStudentByNameAndParents } from "./CsvImportService";

interface FactsSchoolYear {
  yearId: number;
  yearName: string;
  firstDay?: string;
  lastDay?: string;
}

interface FactsPagedResult<T> {
  results?: T[];
  currentPage?: number;
  pageCount?: number;
  pageSize?: number;
  rowCount?: number;
  nextPage?: string | null;
}


interface FactsParentStudent {
  parentID: number;
  studentID: number;
  custody?: boolean;
}

interface FactsPersonApiResult {
  personId: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
}

interface FactsStaffMember {
  staffId: number;
  active?: boolean;
}

interface FactsClass {
  yearId?: number;
  staffId?: number;
  instructor2Id?: number;
  secondaryStaffId?: number;
}

interface FactsStudentSchool {
  status?: string;
  substatus?: string;
  enrollDate?: string;
  withdrawDate?: string;
  gradeLevel?: string;
  nextStatus?: string;
  nextSchoolCode?: string;
  nextGradeLevel?: string;
}

interface FactsStudent {
  personStudentId?: number;
  studentId?: number;
  schoolCode?: string;
  school?: FactsStudentSchool;
  demographics?: {
    person?: FactsPersonApiResult;
  };
}

export type FactsProgressCallback = (message: string) => void;

const reportProgress = (
  onProgress: FactsProgressCallback | undefined,
  message: string,
) => {
  onProgress?.(message);
};

const PERSON_BATCH_SIZE = 50;

const toDateOnly = (value?: string): string => {
  if (!value) {
    return "";
  }
  return value.slice(0, 10);
};

const mapFactsSchoolYear = (factsYear: FactsSchoolYear): SchoolYear => ({
  id: factsYear.yearId,
  name: factsYear.yearName,
  isCurrent: false,
  startDate: toDateOnly(factsYear.firstDay),
  endDate: toDateOnly(factsYear.lastDay),
  factsId: factsYear.yearId,
  lunchTimes: [],
  teacherLunchTimes: [],
  gradeLunchTimes: [],
  studentLunchTimes: [],
  gradesAssignedByClass: [],
  oneTeacherPerStudent: false,
  hideSchedule: false,
});

const getFactsConfig = () => {
  const factsDeveloperKey = process.env.FACTS_DEVELOPER_KEY?.trim();
  const factsApiUrl = process.env.FACTS_API_URL?.trim();

  if (!factsDeveloperKey || !factsApiUrl) {
    throw new Error("FACTS API is not configured on the server.");
  }

  return { factsDeveloperKey, factsApiUrl };
};

const getFactsHeaders = (factsApiKey: string, factsDeveloperKey: string) => ({
  "Ocp-Apim-Subscription-Key": factsDeveloperKey,
  "Facts-Api-Key": factsApiKey,
});

/** Basic FACTS plan: 10 requests/min. Space calls ~6.5s apart (~9/min). */
const FACTS_MIN_REQUEST_INTERVAL_MS = 6_500;
const FACTS_MAX_RETRIES = 3;
const FACTS_REQUEST_TIMEOUT_MS = 60_000;
const FACTS_TRANSIENT_NETWORK_CODES = new Set([
  "ETIMEDOUT",
  "ECONNRESET",
  "ECONNABORTED",
  "EPIPE",
  "ENOTFOUND",
  "EAI_AGAIN",
  "ERR_NETWORK",
]);

let factsNextAvailableAt = 0;
let factsRequestChain: Promise<void> = Promise.resolve();

const waitForFactsThrottleSlot = async (): Promise<void> => {
  const run = factsRequestChain.then(async () => {
    const waitMs = Math.max(0, factsNextAvailableAt - Date.now());
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
    factsNextAvailableAt = Date.now() + FACTS_MIN_REQUEST_INTERVAL_MS;
  });
  // Keep the queue moving even if a prior wait rejects unexpectedly.
  factsRequestChain = run.catch(() => undefined);
  await run;
};

const getRateLimitRetryAfterMs = (error: unknown): number => {
  if (!axios.isAxiosError(error) || error.response?.status !== 429) {
    return 0;
  }
  const retryAfter = error.response.headers?.["retry-after"];
  if (typeof retryAfter === "string") {
    const asSeconds = Number(retryAfter);
    if (!Number.isNaN(asSeconds) && asSeconds >= 0) {
      return asSeconds * 1000;
    }
    const asDate = Date.parse(retryAfter);
    if (!Number.isNaN(asDate)) {
      return Math.max(0, asDate - Date.now());
    }
  }
  return 60_000;
};

const isTransientFactsNetworkError = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) {
    return false;
  }
  if (error.code && FACTS_TRANSIENT_NETWORK_CODES.has(error.code)) {
    return true;
  }
  const causeCode = (error.cause as NodeJS.ErrnoException | undefined)?.code;
  return !!causeCode && FACTS_TRANSIENT_NETWORK_CODES.has(causeCode);
};

const getFactsRetryAfterMs = (error: unknown, attempt: number): number => {
  const rateLimitMs = getRateLimitRetryAfterMs(error);
  if (rateLimitMs > 0) {
    return rateLimitMs;
  }
  if (isTransientFactsNetworkError(error)) {
    // 5s, 10s, 20s…
    return Math.min(30_000, 5_000 * 2 ** attempt);
  }
  return 0;
};

const factsGet = async <T>(
  url: string,
  config: Parameters<typeof axios.get<T>>[1],
): Promise<Awaited<ReturnType<typeof axios.get<T>>>> => {
  let attempt = 0;
  while (true) {
    await waitForFactsThrottleSlot();
    try {
      const params = config?.params
        ? `?${new URLSearchParams(
            Object.entries(config.params).map(([key, value]) => [
              key,
              String(value ?? ""),
            ]),
          ).toString()}`
        : "";
      console.log(`[FACTS] GET ${url}${params}`);
      return await axios.get<T>(url, {
        ...config,
        timeout: FACTS_REQUEST_TIMEOUT_MS,
      });
    } catch (error) {
      const retryAfterMs = getFactsRetryAfterMs(error, attempt);
      if (retryAfterMs <= 0 || attempt >= FACTS_MAX_RETRIES) {
        throw error;
      }
      attempt += 1;
      await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
      // Ensure the shared throttle also respects the cooldown window.
      factsNextAvailableAt = Math.max(
        factsNextAvailableAt,
        Date.now() + FACTS_MIN_REQUEST_INTERVAL_MS,
      );
      console.log(`[FACTS] Retrying after ${retryAfterMs}ms...`);
    }
  }
};

/** FACTS Sieve OR: `field==a|b|c` (repeat values only — not `field==a|field==b`). */
const buildCustodianFilters = (studentIds: number[]): string =>
  `studentID==${studentIds.join("|")}`;

const buildPersonFilters = (personIds: number[]): string =>
  `personId==${personIds.join("|")}`;

const mapPerson = (person: FactsPersonApiResult): FactsPerson =>
  new FactsPerson(
    person.personId,
    person.firstName ?? "",
    person.lastName ?? "",
    person.username ?? "",
    person.email ?? "",
  );

const getFactsTestSeriesNumber = (): number | null => {
  return parseInt(process.env.FACTS_TEST_SERIES ?? "0") || null;
};

const getFactsTestNumber = (): number | null => {
  return parseInt(process.env.FACTS_TEST_NUMBER ?? "0") || null;
};

const isFactsTestMode = (): boolean =>
  !!process.env.FACTS_TEST_NUMBER || !!process.env.FACTS_TEST_SERIES;

const getFactsTestDataDir = (): string => {
  if (process.env.FACTS_TEST_DATA_DIR?.trim()) {
    return path.resolve(process.env.FACTS_TEST_DATA_DIR.trim());
  }
  return path.resolve(__dirname, "../../facts-test-data");
};

const factsTestFileCache = new Map<string, unknown>();

const getFactsTestFilename = (baseName: string): string => {
  const testName = getFactsTestNumber();
  const testSeries = getFactsTestSeriesNumber();

  if (!testName) {
    throw new Error(
      "FACTS test number and series is required when loading FACTS test data.",
    );
  }
  return `${baseName}__${testSeries}__${testName}.json`;
};

const readFactsTestFile = async <T>(baseName: string): Promise<T[]> => {
  const filePath = path.join(
    getFactsTestDataDir(),
    getFactsTestFilename(baseName),
  );
  const cached = factsTestFileCache.get(filePath);
  if (cached) {
    return cached as T[];
  }

  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as T[] | FactsPagedResult<T>;
  const data = Array.isArray(parsed) ? parsed : (parsed.results ?? []);
  factsTestFileCache.set(filePath, data);
  return data;
};

const writeFactsTestFile = async (
  baseName: string,
  series: number,
  testNumber: number,
  data: unknown,
): Promise<string> => {
  const dir = getFactsTestDataDir();
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${baseName}__${series}__${testNumber}.json`);
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  // Ensure a later test-mode read does not use a stale cache entry.
  factsTestFileCache.delete(filePath);
  return filePath;
};

const toPeopleFixture = (people: FactsPerson[]): FactsPersonApiResult[] => {
  const byId = new Map<number, FactsPersonApiResult>();
  for (const person of people) {
    byId.set(person.personId, {
      personId: person.personId,
      firstName: person.firstName ?? "",
      lastName: person.lastName ?? "",
      username: person.username ?? "",
      email: person.email ?? "",
    });
  }
  return [...byId.values()].sort((a, b) => a.personId - b.personId);
};

const fetchSchoolYearsFromFile = async (
  _school: SchoolEntity,
): Promise<FactsSchoolYear[]> => {
  return readFactsTestFile<FactsSchoolYear>("schoolYears");
};

const fetchPeopleFromFile = async (
  _school: SchoolEntity,
  personIds: number[],
): Promise<FactsPerson[]> => {
  const people = await readFactsTestFile<FactsPersonApiResult>("people");
  const personIdSet = personIds.length > 0 ? new Set(personIds) : undefined;

  return people.map(mapPerson).filter((person) => {
    if (personIdSet && !personIdSet.has(person.personId)) {
      return false;
    }
    return true;
  });
};


const fetchStaffFromFile = async (
  _school: SchoolEntity,
): Promise<FactsStaffMember[]> => {
  const staffMembers = await readFactsTestFile<FactsStaffMember>("staff");
  return staffMembers.filter((staff) => staff.active === true);
};

const fetchRelationshipsFromFile = async (
  _school: SchoolEntity,
  options: { parentId?: number; studentIds?: number[] },
): Promise<FactsParentStudent[]> => {
  const relationships =
    await readFactsTestFile<FactsParentStudent>("relationships");
  const studentIdSet =
    options.studentIds && options.studentIds.length > 0
      ? new Set(options.studentIds)
      : undefined;

  if (options.parentId == null && !studentIdSet) {
    return [];
  }

  return relationships.filter((relationship) => {
    if (
      options.parentId != null &&
      relationship.parentID !== options.parentId
    ) {
      return false;
    }
    if (studentIdSet && !studentIdSet.has(relationship.studentID)) {
      return false;
    }
    return true;
  });
};

const fetchClassesFromFile = async (
  _school: SchoolEntity,
  yearId: number,
): Promise<FactsClass[]> => {
  const classes = await readFactsTestFile<FactsClass>("classes");
  return classes.filter((schoolClass) => schoolClass.yearId === yearId);
};

const fetchSchoolYears = async (
  school: SchoolEntity,
): Promise<FactsSchoolYear[]> => {
  if (isFactsTestMode()) {
    return fetchSchoolYearsFromFile(school);
  }

  const { factsDeveloperKey, factsApiUrl } = getFactsConfig();
  const schoolYears: FactsSchoolYear[] = [];
  let page = 1;
  let pageCount = 1;

  do {
    const response = await factsGet<FactsPagedResult<FactsSchoolYear>>(
      `${factsApiUrl}/SchoolYears`,
      {
        params: {
          Page: page,
          PageSize: 100,
        },
        headers: getFactsHeaders(school.factsApiKey, factsDeveloperKey),
      },
    );

    schoolYears.push(...(response.data.results ?? []));
    pageCount = response.data.pageCount ?? 1;
    page += 1;
  } while (page <= pageCount);

  return schoolYears;
};

const isEmailAddress = (email: string): boolean => {
  return email.includes("@") && email.includes(".") && !email.includes(" ");
};

const fetchPeople = async (
  school: SchoolEntity,
  personIds: number[],
): Promise<FactsPerson[]> => {
  if (isFactsTestMode()) {
    return await fetchPeopleFromFile(school, personIds);
  }

  const { factsDeveloperKey, factsApiUrl } = getFactsConfig();
  const people: FactsPerson[] = [];

  const filters: string[] = [];
  if (personIds.length > 0) {
    for (let i = 0; i < personIds.length; i += PERSON_BATCH_SIZE) {
      const batch = personIds.slice(i, i + PERSON_BATCH_SIZE);
      if (batch.length === 0) {
        continue;
      }
      filters.push(buildPersonFilters(batch));
    }
  }

  if (filters.length === 0) {
    return people;
  }

  for (const filter of filters) {
    let page = 1;
    let pageCount = 1;

    do {
      const response = await factsGet<FactsPagedResult<FactsPersonApiResult>>(
        `${factsApiUrl}/People`,
        {
          params: {
            Filters: filter,
            Page: page,
            PageSize: 100,
          },
          headers: getFactsHeaders(school.factsApiKey, factsDeveloperKey),
        },
      );

      people.push(...(response.data.results ?? []).map(mapPerson));
      pageCount = response.data.pageCount ?? 1;
      page += 1;
    } while (page <= pageCount);
  }

  return people.map(mapPerson);
};

const fetchCurrentlyEnrolledStudents = async (
  school: SchoolEntity,
): Promise<FactsStudent[]> => {
  if (isFactsTestMode()) {
    return readFactsTestFile<FactsStudent>("enrolledStudents");
  }

  const { factsDeveloperKey, factsApiUrl } = getFactsConfig();
  const students: FactsStudent[] = [];
  let page = 1;
  let pageCount = 1;

  do {
    const response = await factsGet<FactsPagedResult<FactsStudent>>(
      `${factsApiUrl}/Students`,
      {
        params: {
          Filters: "school.status==Enrolled",
          Page: page,
          PageSize: 100,
        },
        headers: getFactsHeaders(school.factsApiKey, factsDeveloperKey),
      },
    );

    students.push(...(response.data.results ?? []));
    pageCount = response.data.pageCount ?? 1;
    page += 1;
  } while (page <= pageCount);

  return students;
};


const fetchStaff = async (
  school: SchoolEntity,
): Promise<FactsStaffMember[]> => {
  if (isFactsTestMode()) {
    return fetchStaffFromFile(school);
  }

  const { factsDeveloperKey, factsApiUrl } = getFactsConfig();
  const staffMembers: FactsStaffMember[] = [];
  let page = 1;
  let pageCount = 1;

  do {
    const response = await factsGet<FactsPagedResult<FactsStaffMember>>(
      `${factsApiUrl}/People/Staff`,
      {
        params: {
          Filters: "active==true",
          Page: page,
          PageSize: 100,
        },
        headers: getFactsHeaders(school.factsApiKey, factsDeveloperKey),
      },
    );

    staffMembers.push(...(response.data.results ?? []));
    pageCount = response.data.pageCount ?? 1;
    page += 1;
  } while (page <= pageCount);

  return staffMembers;
};

const fetchRelationships = async (
  school: SchoolEntity,
  options: { parentId?: number; studentIds?: number[] },
): Promise<FactsParentStudent[]> => {
  if (isFactsTestMode()) {
    return fetchRelationshipsFromFile(school, options);
  }

  const { factsDeveloperKey, factsApiUrl } = getFactsConfig();
  const relationships: FactsParentStudent[] = [];

  const filterBatches: string[] = [];
  if (options.parentId != null) {
    filterBatches.push(`parentID==${options.parentId}`);
  }
  if (options.studentIds && options.studentIds.length > 0) {
    for (let i = 0; i < options.studentIds.length; i += PERSON_BATCH_SIZE) {
      const batch = options.studentIds.slice(i, i + PERSON_BATCH_SIZE);
      if (batch.length === 0) {
        continue;
      }
      filterBatches.push(buildCustodianFilters(batch));
    }
  }

  if (filterBatches.length === 0) {
    return relationships;
  }

  for (const filter of filterBatches) {
    let page = 1;
    let pageCount = 1;

    do {
      const response = await factsGet<FactsPagedResult<FactsParentStudent>>(
        `${factsApiUrl}/People/ParentStudent`,
        {
          params: {
            Filters: filter,
            Page: page,
            PageSize: 100,
          },
          headers: getFactsHeaders(school.factsApiKey, factsDeveloperKey),
        },
      );

      relationships.push(...(response.data.results ?? []));
      pageCount = response.data.pageCount ?? 1;
      page += 1;
    } while (page <= pageCount);
  }

  return relationships;
};

const fetchClasses = async (
  school: SchoolEntity,
  yearId: number,
): Promise<FactsClass[]> => {
  if (isFactsTestMode()) {
    return fetchClassesFromFile(school, yearId);
  }

  const { factsDeveloperKey, factsApiUrl } = getFactsConfig();
  const classes: FactsClass[] = [];
  let page = 1;
  let pageCount = 1;

  do {
    const response = await factsGet<FactsPagedResult<FactsClass>>(
      `${factsApiUrl}/Classes`,
      {
        params: {
          Filters: `yearId==${yearId}`,
          Page: page,
          PageSize: 100,
        },
        headers: getFactsHeaders(school.factsApiKey, factsDeveloperKey),
      },
    );

    classes.push(...(response.data.results ?? []));
    pageCount = response.data.pageCount ?? 1;
    page += 1;
  } while (page <= pageCount);

  return classes;
};

const upsertFactsStudent = async (
  school: SchoolEntity,
  student: StudentEntity | undefined,
  factsStudent: FactsPerson,
): Promise<StudentEntity> => {
  const studentRepository = AppDataSource.getRepository(StudentEntity);

  if (student) {
    student.firstName = factsStudent.firstName || student.firstName;
    student.lastName = factsStudent.lastName || student.lastName;
    student.name =
      `${factsStudent.firstName} ${factsStudent.lastName}`.trim() ||
      student.name;
    // Keep a single student row for the district; point it at the importing school.
    student.school = school;
    student.factsId = factsStudent.personId;
    return await studentRepository.save(student);
  }

  const newStudent: DeepPartial<StudentEntity> = {
    id: undefined,
    factsId: factsStudent.personId,
    studentId: factsStudent.personId.toString(),
    firstName: factsStudent.firstName,
    lastName: factsStudent.lastName,
    name: `${factsStudent.firstName} ${factsStudent.lastName}`.trim(),
    birthDate: "",
    school,
  };

  return await studentRepository.save(newStudent);
};

/** Match students by factsId within the same school district (facts schools). */
const findExistingStudentsByFactsIds = async (
  school: SchoolEntity,
  factsStudentIds: number[],
): Promise<StudentEntity[]> => {
  if (factsStudentIds.length === 0) {
    return [];
  }

  const studentRepository = AppDataSource.getRepository(StudentEntity);
  const schoolRepository = AppDataSource.getRepository(SchoolEntity);

  const schoolWithDistrict =
    school.schoolDistrict !== undefined
      ? school
      : ((await schoolRepository.findOne({
          where: { id: school.id },
          relations: { schoolDistrict: true },
        })) ?? school);

  const districtId = schoolWithDistrict.schoolDistrict?.id;
  const isFactsSchool = !!schoolWithDistrict.factsApiKey?.trim();

  // Non-FACTS schools, or schools without a district: only match within this school.
  if (!isFactsSchool || !districtId) {
    return studentRepository.find({
      where: {
        school: { id: school.id },
        factsId: In(factsStudentIds),
      },
      relations: { school: true },
    });
  }

  return studentRepository.find({
    where: {
      school: { schoolDistrict: { id: districtId } },
      factsId: In(factsStudentIds),
    },
    relations: { school: { schoolDistrict: true } },
  });
};

const pickExistingStudentForFactsId = (
  existingStudents: StudentEntity[],
  factsId: number,
  schoolId: number,
): StudentEntity | undefined =>
  existingStudents.find(
    (student) => student.factsId === factsId && student.school?.id === schoolId,
  ) ?? existingStudents.find((student) => student.factsId === factsId);

const findMatchingFactsRoleUser = (
  schoolFactsRoleUsers: UserEntity[],
  schoolId: number,
  factsPerson: FactsPerson,
): UserEntity | undefined => {
  const factsEmail = factsPerson.email?.trim().toLowerCase() ?? "";

  return schoolFactsRoleUsers.find((user) => {
    const status = user.userStatuses?.find(
      (userStatus) =>
        userStatus.school?.id === schoolId &&
        isFactsUserRole(userStatus.role),
    );
    if (!status) {
      return false;
    }

    if (status.factsId === factsPerson.personId) {
      return true;
    }

    if (status.factsId != null || !factsEmail) {
      return false;
    }

    return (
      user.userName?.toLowerCase() === factsEmail
    );
  });
};

const upsertFactsSchoolUser = async (
  school: SchoolEntity,
  schoolFactsRoleUsers: UserEntity[],
  factsPerson: FactsPerson,
  role: Role,
): Promise<void> => {
  if (!isEmailAddress(factsPerson.email)) {
    return;
  }

  const userRepository = AppDataSource.getRepository(UserEntity);

  const matchingUser = findMatchingFactsRoleUser(
    schoolFactsRoleUsers,
    school.id,
    factsPerson,
  );

  if (!matchingUser) {

    const existingByUserName = await userRepository.findOne({
      where: { userName: factsPerson.email.toLowerCase() },
    });
    if (existingByUserName) {
      return;
    }

    const createdUser = await createUserWithStatus({
      id: undefined,
      userName: factsPerson.email.toLowerCase(),
      firstName: factsPerson.firstName ?? "",
      lastName: factsPerson.lastName ?? "",
      name: `${factsPerson.firstName ?? ""} ${factsPerson.lastName ?? ""}`.trim(),
      email: factsPerson.email.toLowerCase(),
      phone: "",
      pwd: "",
      school,
      role,
      accountStatus: AccountStatus.PENDING,
      factsId: factsPerson.personId,
    });
    schoolFactsRoleUsers.push(createdUser);
    return;
  }

  const status = matchingUser.userStatuses.find(
    (userStatus) => userStatus.school?.id === school.id,
  );
  if (!status) {
    return;
  }

  if (status.factsId !== factsPerson.personId) {
    status.factsId = factsPerson.personId;
    await saveUserStatus(status);
  }
};

const ensureFactsTeachersAndStaff = async (
  school: SchoolEntity,
  schoolFactsRoleUsers: UserEntity[],
  teachers: FactsPerson[],
  nonTeacherStaff: FactsPerson[],
): Promise<void> => {
  for (const teacher of teachers) {
    await upsertFactsSchoolUser(
      school,
      schoolFactsRoleUsers,
      teacher,
      Role.TEACHER,
    );
  }
  for (const staffMember of nonTeacherStaff) {
    await upsertFactsSchoolUser(
      school,
      schoolFactsRoleUsers,
      staffMember,
      Role.STAFF,
    );
  }
};

const getStudentRelationships = async (
  school: SchoolEntity,
  students: FactsPerson[],
): Promise<FactsRelationship[]> => {
  const requestedStudentIds = new Set(
    students.map((student) => student.personId),
  );
  const studentsByParentId = new Map<number, Set<number>>();

  const relationships = await fetchRelationships(school, {
    studentIds: students.map((student) => student.personId),
  });

  for (const parentStudent of relationships) {
    if (
      !parentStudent.custody ||
      parentStudent.parentID == null ||
      !requestedStudentIds.has(parentStudent.studentID)
    ) {
      continue;
    }

    let childIds = studentsByParentId.get(parentStudent.parentID);
    if (!childIds) {
      childIds = new Set();
      studentsByParentId.set(parentStudent.parentID, childIds);
    }
    childIds.add(parentStudent.studentID);
  }

  const parents = await fetchPeople(school, [...studentsByParentId.keys()]);

  return parents.map((parent) => {
    const childIds = studentsByParentId.get(parent.personId);
    return new FactsRelationship(
      parent,
      students.filter((student) => childIds?.has(student.personId)),
    );
  });
};

const getTeachers = async (
  school: SchoolEntity,
  yearId: number,
  staffMembers: FactsPerson[],
): Promise<FactsPerson[]> => {
  const classes = await fetchClasses(school, yearId);
  const teacherIds = new Set<number>();

  for (const schoolClass of classes) {
    if (schoolClass.staffId != null) {
      teacherIds.add(schoolClass.staffId);
    }
    if (schoolClass.instructor2Id != null) {
      teacherIds.add(schoolClass.instructor2Id);
    }
  }

  return staffMembers.filter((staff) => teacherIds.has(staff.personId));
};

const getStaffMembers = async (
  school: SchoolEntity,
): Promise<FactsPerson[]> => {
  const staffMembers = await fetchStaff(school);
  const staffIds = [
    ...new Set(
      staffMembers
        .filter((staff) => staff.staffId != null && staff.active === true)
        .map((staff) => staff.staffId),
    ),
  ];

  return await fetchPeople(school, staffIds);
};

const getEnrolledStudents = async (
  school: SchoolEntity,
): Promise<FactsPerson[]> => {
  const enrolledStudents = await fetchCurrentlyEnrolledStudents(school);
  const studentIds = [
    ...new Set(
      enrolledStudents
        .map((student) => student.studentId)
        .filter((studentId): studentId is number => studentId != null),
    ),
  ];

  return await fetchPeople(school, studentIds);
};

export class FactsService {
  static async getSchoolYears(school: SchoolEntity): Promise<SchoolYear[]> {
    const schoolYears = await fetchSchoolYears(school);
    return schoolYears.map(mapFactsSchoolYear);
  }

  static async updateEnrolledChildren(
    school: SchoolEntity,
    parentFactId: number,
    factsYearId: number,
  ) {
    const schoolYear = await AppDataSource.getRepository(
      SchoolYearEntity,
    ).findOne({
      where: { school: { id: school.id }, factsId: factsYearId },
    });
    if (!schoolYear) {
      return;
    }

    const userRepository = AppDataSource.getRepository(UserEntity);
    const studentRepository = AppDataSource.getRepository(StudentEntity);
    const enrollmentRepository = AppDataSource.getRepository(EnrollmentEntity);

    const parentUser = await userRepository.findOne({
      where: {
        userStatuses: {
          school: { id: school.id },
          factsId: parentFactId,
          role: In([Role.PARENT, Role.TEACHER, Role.STAFF]),
        },
      },
      relations: {
        userStatuses: {
          school: true,
        },
      },
    });
    if (!parentUser) {
      return;
    }

    const relationships = await fetchRelationships(school, {
      parentId: parentFactId,
    });
    const custodialChildIds = new Set(
      relationships
        .filter(
          (parentStudent) =>
            parentStudent.custody &&
            parentStudent.studentID != null &&
            parentStudent.parentID === parentFactId,
        )
        .map((parentStudent) => parentStudent.studentID),
    );

    const enrolledChildIds: number[] = [];
    if (custodialChildIds.size > 0) {
      const currentlyEnrolled = await fetchCurrentlyEnrolledStudents(school);
      const enrolledSet = new Set<number>();
      for (const student of currentlyEnrolled) {
        if (
          student.studentId != null &&
          custodialChildIds.has(student.studentId)
        ) {
          enrolledSet.add(student.studentId);
        }
      }
      enrolledChildIds.push(...enrolledSet);
    }

    // Soft-deactivate existing links, then reactivate/create from FACTS.
    await enrollmentRepository.update(
      {
        user: { id: parentUser.id },
        schoolYear: { id: schoolYear.id },
      },
      { active: false },
    );

    if (enrolledChildIds.length === 0) {
      return;
    }

    const factsStudents = await fetchPeople(school, enrolledChildIds);

    const existingStudentEntities = await findExistingStudentsByFactsIds(
      school,
      enrolledChildIds,
    );

    const studentsByFactsId = new Map<number, StudentEntity>();
    for (const factsStudent of factsStudents) {
      const studentEntity = await upsertFactsStudent(
        school,
        pickExistingStudentForFactsId(
          existingStudentEntities,
          factsStudent.personId,
          school.id,
        ),
        factsStudent,
      );
      studentsByFactsId.set(factsStudent.personId, studentEntity);
    }

    const parentStudentLinks: Array<{
      userId: number;
      studentId: number;
      schoolYearId: number;
      active: boolean;
    }> = [];
    const seenLinks = new Set<string>();

    for (const childId of enrolledChildIds) {
      const student = studentsByFactsId.get(childId);
      if (!student) {
        continue;
      }
      const linkKey = `${parentUser.id}:${student.id}`;
      if (seenLinks.has(linkKey)) {
        continue;
      }
      seenLinks.add(linkKey);
      parentStudentLinks.push({
        userId: parentUser.id,
        studentId: student.id,
        schoolYearId: schoolYear.id,
        active: true,
      });
    }

    if (parentStudentLinks.length > 0) {
      await upsertEnrollmentLinks(parentStudentLinks);
      await deactivateEnrollmentsAtOtherDistrictSchoolsForStudents(
        parentStudentLinks.map((link) => link.studentId),
        school.id,
      );
    }
  }

  static async captureSchoolYearTestData(
    school: SchoolEntity,
    schoolYear: SchoolYearEntity,
    series = 999,
    testNumber = 1,
    onProgress?: FactsProgressCallback,
  ): Promise<string | undefined> {
    if (isFactsTestMode()) {
      return "Cannot capture FACTS test data while FACTS test mode is enabled.";
    }

    const factsApiKey = school?.factsApiKey?.trim();
    if (!factsApiKey) {
      return "FACTS API key is not configured for this school.";
    }
    if (!schoolYear.factsId) {
      return "School year is not linked to a FACTS year.";
    }

    const factsYearId = schoolYear.factsId;
    const startedAt = Date.now();

    reportProgress(onProgress, "Fetching school years from FACTS…");
    const schoolYears = await fetchSchoolYears(school);

    reportProgress(onProgress, "Fetching currently enrolled students from FACTS…");
    const enrolledStudents = await fetchCurrentlyEnrolledStudents(school);
    const studentIds = [
      ...new Set(
        enrolledStudents
          .map((student) => student.studentId)
          .filter((studentId): studentId is number => studentId != null),
      ),
    ];

    reportProgress(onProgress, "Fetching enrolled student people from FACTS…");
    const students =
      studentIds.length > 0 ? await fetchPeople(school, studentIds) : [];

    reportProgress(onProgress, "Fetching parent relationships from FACTS…");
    const relationships =
      studentIds.length > 0
        ? await fetchRelationships(school, { studentIds })
        : [];
    const parentIds = [
      ...new Set(
        relationships
          .map((relationship) => relationship.parentID)
          .filter((parentId): parentId is number => parentId != null),
      ),
    ];

    reportProgress(onProgress, "Fetching parents from FACTS…");
    const parents =
      parentIds.length > 0 ? await fetchPeople(school, parentIds) : [];

    reportProgress(onProgress, "Fetching staff from FACTS…");
    const staff = await fetchStaff(school);
    const staffIds = [
      ...new Set(
        staff
          .filter((member) => member.staffId != null && member.active === true)
          .map((member) => member.staffId),
      ),
    ];

    reportProgress(onProgress, "Fetching staff people from FACTS…");
    const staffPeople =
      staffIds.length > 0 ? await fetchPeople(school, staffIds) : [];

    reportProgress(onProgress, "Fetching classes from FACTS…");
    const classes = await fetchClasses(school, factsYearId);

    const people = toPeopleFixture([...students, ...parents, ...staffPeople]);

    reportProgress(onProgress, "Writing FACTS test fixture files…");
    const writtenFiles = await Promise.all([
      writeFactsTestFile("schoolYears", series, testNumber, schoolYears),
      writeFactsTestFile(
        "enrolledStudents",
        series,
        testNumber,
        enrolledStudents,
      ),
      writeFactsTestFile("people", series, testNumber, people),
      writeFactsTestFile("relationships", series, testNumber, relationships),
      writeFactsTestFile("staff", series, testNumber, staff),
      writeFactsTestFile("classes", series, testNumber, classes),
    ]);

    reportProgress(
      onProgress,
      `Captured FACTS fixtures for series ${series}, test ${testNumber}: ${writtenFiles.length} files.`,
    );
    const elapsedMs = Date.now() - startedAt;
    const elapsedMinutes = Math.floor(elapsedMs / 60000);
    const elapsedSeconds = Math.floor((elapsedMs % 60000) / 1000);
    console.log(
      `[FACTS] captureSchoolYearTestData completed in ${elapsedMinutes}m ${elapsedSeconds}s`,
    );
    return undefined;
  }

  static async synchronizeSchoolYear(
    school: SchoolEntity,
    schoolYear: SchoolYearEntity,
    onProgress?: FactsProgressCallback,
  ): Promise<string | undefined> {
    const factsApiKey = school?.factsApiKey?.trim();
    if (!factsApiKey) {
      return "FACTS API key is not configured for this school.";
    }
    if (!schoolYear.factsId) {
      return "School year is not linked to a FACTS year.";
    }
    const factsYearId = schoolYear.factsId;

    reportProgress(onProgress, "Fetching enrolled students from FACTS…");
    const enrolledStudents = await getEnrolledStudents(school);
    reportProgress(onProgress, "Fetching parent relationships from FACTS…");
    const factsRelationships = await getStudentRelationships(
      school,
      enrolledStudents,
    );
    reportProgress(onProgress, "Fetching staff and teachers from FACTS…");
    const staffMembers = await getStaffMembers(school);
    const teachers = await getTeachers(school, factsYearId, staffMembers);
    const nonTeacherStaff = staffMembers.filter(
      (staff) =>
        !teachers.some((teacher) => teacher.personId === staff.personId),
    );

    const userRepository = AppDataSource.getRepository(UserEntity);

    reportProgress(onProgress, "Updating users…");
    const schoolFactsRoleUsers = await userRepository.find({
      where: {
        userStatuses: {
          school: { id: school.id },
          role: In([Role.PARENT, Role.TEACHER, Role.STAFF]),
        },
      },
      relations: {
        userStatuses: {
          school: true,
        },
      },
    });

    for (const factsRelationship of factsRelationships) {
      const factsParent = factsRelationship.parent;

      const role = teachers.some(
        (teacher) => teacher.personId === factsParent.personId,
      )
        ? Role.TEACHER
        : nonTeacherStaff.some(
              (staff) => staff.personId === factsParent.personId,
            )
          ? Role.STAFF
          : Role.PARENT;

      await upsertFactsSchoolUser(
        school,
        schoolFactsRoleUsers,
        factsParent,
        role,
      );
    }

    await ensureFactsTeachersAndStaff(
      school,
      schoolFactsRoleUsers,
      teachers,
      nonTeacherStaff,
    );

    reportProgress(onProgress, "Updating students and enrollments…");
    await AppDataSource.getRepository(EnrollmentEntity).update(
      { schoolYear: { id: schoolYear.id } },
      { active: false },
    );

    const factsStudentsById = new Map<number, FactsPerson>();
    for (const relationship of factsRelationships) {
      for (const child of relationship.children) {
        if (!factsStudentsById.has(child.personId)) {
          factsStudentsById.set(child.personId, child);
        }
      }
    }
    const factsStudents = [...factsStudentsById.values()];
    const factsStudentIds = factsStudents.map((student) => student.personId);

    const parentEmailsByStudentFactsId = new Map<number, string[]>();
    for (const relationship of factsRelationships) {
      const parentEmail = relationship.parent.email?.trim().toLowerCase() ?? "";
      if (!isEmailAddress(parentEmail)) {
        continue;
      }
      for (const child of relationship.children) {
        const emails = parentEmailsByStudentFactsId.get(child.personId) ?? [];
        if (!emails.includes(parentEmail)) {
          emails.push(parentEmail);
        }
        parentEmailsByStudentFactsId.set(child.personId, emails);
      }
    }

    const existingStudentEntities = await findExistingStudentsByFactsIds(
      school,
      factsStudentIds,
    );

    const studentsByFactsId = new Map<number, StudentEntity>();
    for (const factsStudent of factsStudents) {
      let existingStudent = pickExistingStudentForFactsId(
        existingStudentEntities,
        factsStudent.personId,
        school.id,
      );

      if (!existingStudent) {
        const parentEmails =
          parentEmailsByStudentFactsId.get(factsStudent.personId) ?? [];
        existingStudent =
          (await findMatchingStudentByNameAndParents(
            school,
            factsStudent.firstName,
            factsStudent.lastName,
            parentEmails,
            { requireNullFactsId: true },
          )) ?? undefined;
      }

      const studentEntity = await upsertFactsStudent(
        school,
        existingStudent,
        factsStudent,
      );
      studentsByFactsId.set(factsStudent.personId, studentEntity);
    }

    const parentStudentLinks: Array<{
      userId: number;
      studentId: number;
      schoolYearId: number;
      active: boolean;
    }> = [];
    const seenLinks = new Set<string>();

    for (const factsRelationship of factsRelationships) {
      const parentUser = schoolFactsRoleUsers.find((user) =>
        user.userStatuses?.some(
          (status) =>
            status.school?.id === school.id &&
            isFactsUserRole(status.role) &&
            status.factsId === factsRelationship.parent.personId,
        ),
      );
      if (!parentUser) {
        continue;
      }

      for (const child of factsRelationship.children) {
        const student = studentsByFactsId.get(child.personId);
        if (!student) {
          continue;
        }
        const linkKey = `${parentUser.id}:${student.id}`;
        if (seenLinks.has(linkKey)) {
          continue;
        }
        seenLinks.add(linkKey);
        parentStudentLinks.push({
          userId: parentUser.id,
          studentId: student.id,
          schoolYearId: schoolYear.id,
          active: true,
        });
      }
    }

    if (parentStudentLinks.length > 0) {
      await upsertEnrollmentLinks(parentStudentLinks);
      await deactivateEnrollmentsAtOtherDistrictSchoolsForStudents(
        parentStudentLinks.map((link) => link.studentId),
        school.id,
      );
    }

    reportProgress(onProgress, "Synchronization complete.");
    return undefined;
  }
}
