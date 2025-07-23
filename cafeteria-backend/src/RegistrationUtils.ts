import { randomUUID } from "crypto";
import { AppDataSource } from "./data-source";
import StudentEntity from "./entity/StudentEntity";
import UserEntity from "./entity/UserEntity";
import User, { Role } from "./models/User";
import Student from "./models/Student";

interface StudentImport {
  studentName: string;
  studentExternalId: string;
  parentName: string;
  parentExternalId: string;
  parentEmail: string;
}

interface InvitationLink {
  parentName: string;
  url: string;
}

interface InvitationEmail {
  email: string;
  parentInvitationLinks: InvitationLink[];
  studentNames: string[];
}

export const importStudents = async (
  schoolId: number,
  allImports: StudentImport[]
) => {
  const userRepository = AppDataSource.getRepository(UserEntity);
  const studentRepository = AppDataSource.getRepository(StudentEntity);

  const users = await userRepository.find({
    where: { school: { id: schoolId } },
  });

  const students = await studentRepository.find({
    where: { school: {id: schoolId} },
  });

  while (allImports.length) {
    const studentImport = allImports[0];
    const invitesToSend: {
      email: string;
      student: Student;
      parents: User[];
    }[] = [];

    let student = students.find(
      (stu) => stu.studentId === studentImport.studentExternalId
    );
    if (!student) {
        student = await studentRepository.save({
          id: undefined,
          studentId: randomUUID(),
          schoolId: schoolId,
          name: studentImport.studentName
        });
    }
    const studentImports = allImports.filter(
      (imp) => imp.studentExternalId === studentImport.studentExternalId
    );

    for (const studentImport of studentImports) {
      let parent = users.find(
        (par) => par.externalId === studentImport.parentExternalId
      );

      if (!parent) {
        parent = await userRepository.save({
          id: undefined,
          userName: randomUUID(),
          name: studentImport.parentName,
          email: studentImport.parentEmail,
          phone: "",
          pwd: "",
          lunchTimes: [],
          role: Role.PARENT,
          school: { id: schoolId },
        })!;

        await AppDataSource.createQueryBuilder()
          .relation(UserEntity, "students")
          .of(parent)
          .add(student);

        const existingInvite = invitesToSend.find(
          (invite) => invite.email === studentImport.parentEmail
        );
        if (existingInvite) {
          existingInvite.parents.push(new User(parent!));
        } else {
          invitesToSend.push({
            email: studentImport.parentEmail,
            student: new Student(student!),
            parents: [new User(parent!)],
          });
        }
      } else {
        const siblings: StudentEntity[] =
          await AppDataSource.createQueryBuilder()
            .relation(UserEntity, "students")
            .of(parent)
            .loadMany();
        if (
          !siblings.find(
            (sibling) =>
              sibling.studentId === studentImport.studentExternalId ||
              sibling.name.toLowerCase() ===
                studentImport.studentName.toLowerCase()
          )
        ) {
          await AppDataSource.createQueryBuilder()
            .relation(UserEntity, "students")
            .of(parent)
            .add(student);
        }
      }
    }
    allImports = allImports.filter(
      (imps) => imps.studentExternalId !== studentImport.studentExternalId
    );
  }
};
