import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLunchTimeBlockedDates1784520000000
  implements MigrationInterface
{
  name = "AddLunchTimeBlockedDates1784520000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`teacher_lunch_time\` ADD \`blockedDates\` varchar(255) NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE \`grade_lunch_time\` ADD \`blockedDates\` varchar(255) NOT NULL DEFAULT ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`grade_lunch_time\` DROP COLUMN \`blockedDates\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`teacher_lunch_time\` DROP COLUMN \`blockedDates\``,
    );
  }
}
