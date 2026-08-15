import { MigrationInterface, QueryRunner } from "typeorm";

export class DropStudentEnrolled1784515000000 implements MigrationInterface {
  name = "DropStudentEnrolled1784515000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`student\` DROP COLUMN \`enrolled\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`student\` ADD \`enrolled\` tinyint NOT NULL DEFAULT 1`,
    );
  }
}
