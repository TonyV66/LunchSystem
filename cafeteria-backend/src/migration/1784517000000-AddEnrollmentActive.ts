import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEnrollmentActive1784517000000 implements MigrationInterface {
  name = "AddEnrollmentActive1784517000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`enrollment\` ADD \`active\` tinyint NOT NULL DEFAULT 1`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`enrollment\` DROP COLUMN \`active\``,
    );
  }
}
