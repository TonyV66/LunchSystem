import StudentEntity from "../entity/StudentEntity";

export default class Student {
  id: number;
  studentId: string;
  name: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  parents: number[];

  constructor(entity: StudentEntity) {
    this.id = entity.id;
    this.studentId = entity.studentId;
    this.name = entity.name;
    this.firstName = entity.firstName;
    this.lastName = entity.lastName;
    this.birthDate = entity.birthDate;
    this.parents = entity.parents?.map(parent => parent.id) ?? [];
  }
}
