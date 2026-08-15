import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import SchoolEntity from "./SchoolEntity";

@Entity("school_district")
export default class SchoolDistrictEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ default: "" })
  factsApiKey: string;

  @OneToMany(() => SchoolEntity, (school) => school.schoolDistrict)
  schools: SchoolEntity[];
}
