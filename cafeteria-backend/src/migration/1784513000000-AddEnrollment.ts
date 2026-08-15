import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEnrollment1784513000000 implements MigrationInterface {
  name = "AddEnrollment1784513000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`enrollment\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`userId\` int NULL,
        \`studentId\` int NULL,
        \`schoolYearId\` int NULL,
        UNIQUE INDEX \`IDX_enrollment_user_student_schoolYear\` (\`userId\`, \`studentId\`, \`schoolYearId\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(`
      ALTER TABLE \`enrollment\`
      ADD CONSTRAINT \`FK_enrollment_user\`
      FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE \`enrollment\`
      ADD CONSTRAINT \`FK_enrollment_student\`
      FOREIGN KEY (\`studentId\`) REFERENCES \`student\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE \`enrollment\`
      ADD CONSTRAINT \`FK_enrollment_school_year\`
      FOREIGN KEY (\`schoolYearId\`) REFERENCES \`school_year\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      INSERT INTO \`enrollment\` (\`userId\`, \`studentId\`, \`schoolYearId\`)
      SELECT \`userId\`, \`studentId\`, 2 FROM \`user_students\`
    `);

    await queryRunner.query(`DROP TABLE \`user_students\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`user_students\` (
        \`userId\` int NOT NULL,
        \`studentId\` int NOT NULL,
        INDEX \`IDX_user_students_student\` (\`studentId\`),
        INDEX \`IDX_user_students_user\` (\`userId\`),
        PRIMARY KEY (\`userId\`, \`studentId\`)
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(`
      ALTER TABLE \`user_students\`
      ADD CONSTRAINT \`FK_user_students_user\`
      FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`)
      ON DELETE CASCADE ON UPDATE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE \`user_students\`
      ADD CONSTRAINT \`FK_user_students_student\`
      FOREIGN KEY (\`studentId\`) REFERENCES \`student\`(\`id\`)
      ON DELETE CASCADE ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      INSERT INTO \`user_students\` (\`userId\`, \`studentId\`)
      SELECT DISTINCT \`userId\`, \`studentId\` FROM \`enrollment\`
    `);

    await queryRunner.query(
      `ALTER TABLE \`enrollment\` DROP FOREIGN KEY \`FK_enrollment_school_year\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`enrollment\` DROP FOREIGN KEY \`FK_enrollment_student\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`enrollment\` DROP FOREIGN KEY \`FK_enrollment_user\``,
    );
    await queryRunner.query(`DROP TABLE \`enrollment\``);
  }
}
