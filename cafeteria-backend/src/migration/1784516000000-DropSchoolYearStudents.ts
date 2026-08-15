import { MigrationInterface, QueryRunner } from "typeorm";

export class DropSchoolYearStudents1784516000000 implements MigrationInterface {
  name = "DropSchoolYearStudents1784516000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`school_year_students\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`school_year_students\` (
        \`schoolYearId\` int NOT NULL,
        \`studentId\` int NOT NULL,
        INDEX \`IDX_e022e401dc8161acec37c70f51\` (\`schoolYearId\`),
        INDEX \`IDX_c6220caebace0dbe00e6ca5b0e\` (\`studentId\`),
        PRIMARY KEY (\`schoolYearId\`, \`studentId\`)
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(`
      ALTER TABLE \`school_year_students\`
      ADD CONSTRAINT \`FK_c6220caebace0dbe00e6ca5b0e7\`
      FOREIGN KEY (\`studentId\`) REFERENCES \`student\`(\`id\`)
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE \`school_year_students\`
      ADD CONSTRAINT \`FK_e022e401dc8161acec37c70f511\`
      FOREIGN KEY (\`schoolYearId\`) REFERENCES \`school_year\`(\`id\`)
      ON DELETE CASCADE ON UPDATE CASCADE
    `);
  }
}
