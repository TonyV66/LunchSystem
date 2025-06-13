import StudentEntity from "../entity/StudentEntity";

export default class Student {
  id: number;
  studentId: string;
  name: string;
  parents: number[];

  constructor(entity: StudentEntity) {
    this.id = entity.id;
    this.studentId = entity.studentId;
    this.name = entity.name;
    this.parents = entity.parents?.map(parent => parent.id) ?? [];
  }
}
