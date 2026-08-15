import { MigrationInterface, QueryRunner } from "typeorm";

export class IndexFactsIdColumns1784512000000 implements MigrationInterface {
  name = "IndexFactsIdColumns1784512000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX \`IDX_school_year_factsId\` ON \`school_year\` (\`factsId\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_student_factsId\` ON \`student\` (\`factsId\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_user_status_factsId\` ON \`user_status\` (\`factsId\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_user_status_factsId\` ON \`user_status\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_student_factsId\` ON \`student\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_school_year_factsId\` ON \`school_year\``,
    );
  }
}
