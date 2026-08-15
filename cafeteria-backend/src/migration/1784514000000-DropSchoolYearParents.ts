import { MigrationInterface, QueryRunner } from "typeorm";

export class DropSchoolYearParents1784514000000 implements MigrationInterface {
  name = "DropSchoolYearParents1784514000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`school_year_parents\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`school_year_parents\` (
        \`schoolYearId\` int NOT NULL,
        \`userId\` int NOT NULL,
        INDEX \`IDX_85577aa92c7d4d5cc51cc7bb31\` (\`schoolYearId\`),
        INDEX \`IDX_364a3a9c5ccca3f3db3f1081b4\` (\`userId\`),
        PRIMARY KEY (\`schoolYearId\`, \`userId\`)
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(`
      ALTER TABLE \`school_year_parents\`
      ADD CONSTRAINT \`FK_364a3a9c5ccca3f3db3f1081b47\`
      FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`)
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE \`school_year_parents\`
      ADD CONSTRAINT \`FK_85577aa92c7d4d5cc51cc7bb31f\`
      FOREIGN KEY (\`schoolYearId\`) REFERENCES \`school_year\`(\`id\`)
      ON DELETE CASCADE ON UPDATE CASCADE
    `);
  }
}
