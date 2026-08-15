import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSchoolDistrict1784518000000 implements MigrationInterface {
  name = "AddSchoolDistrict1784518000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`school_district\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(255) NOT NULL,
        \`factsApiKey\` varchar(255) NOT NULL DEFAULT '',
        \`tempSchoolId\` int NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      ALTER TABLE \`school\`
      ADD \`schoolDistrictId\` int NULL
    `);

    // One district per school: copy name and factsApiKey from each school.
    await queryRunner.query(`
      INSERT INTO \`school_district\` (\`name\`, \`factsApiKey\`, \`tempSchoolId\`)
      SELECT \`name\`, \`factsApiKey\`, \`id\` FROM \`school\`
    `);

    await queryRunner.query(`
      UPDATE \`school\` s
      INNER JOIN \`school_district\` d ON d.\`tempSchoolId\` = s.\`id\`
      SET s.\`schoolDistrictId\` = d.\`id\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`school_district\`
      DROP COLUMN \`tempSchoolId\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`school\`
      ADD CONSTRAINT \`FK_school_school_district\`
      FOREIGN KEY (\`schoolDistrictId\`) REFERENCES \`school_district\`(\`id\`)
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`school\` DROP FOREIGN KEY \`FK_school_school_district\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`school\` DROP COLUMN \`schoolDistrictId\``,
    );
    await queryRunner.query(`DROP TABLE \`school_district\``);
  }
}
