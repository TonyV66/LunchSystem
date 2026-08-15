import StudentEntity from "../entity/StudentEntity";

export default class Student {
  id: number;
  studentId: string;
  name: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  factsId: number | null;
  parents: number[];

  constructor(entity: StudentEntity) {
    this.id = entity.id;
    this.studentId = entity.studentId;
    this.name = entity.name;
    this.firstName = entity.firstName;
    this.lastName = entity.lastName;
    this.birthDate = entity.birthDate;
    this.factsId = entity.factsId;
    this.parents = Array.from(
      new Set(
        entity.enrollments
          ?.filter((enrollment) => enrollment.active)
          ?.map((enrollment) => enrollment.user?.id)
          .filter((id): id is number => typeof id === "number") ?? [],
      ),
    );
  }
}
