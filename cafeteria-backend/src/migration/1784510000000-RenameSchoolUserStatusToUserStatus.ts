import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameSchoolUserStatusToUserStatus1784510000000
  implements MigrationInterface
{
  name = "RenameSchoolUserStatusToUserStatus1784510000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`school_user_status\` DROP FOREIGN KEY \`FK_school_user_status_user\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`school_user_status\` DROP FOREIGN KEY \`FK_school_user_status_school\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`school_user_status\` RENAME INDEX \`IDX_school_user_status_user_school\` TO \`IDX_user_status_user_school\``,
    );
    await queryRunner.query(
      `RENAME TABLE \`school_user_status\` TO \`user_status\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_status\` CHANGE \`status\` \`accountStatus\` varchar(255) NOT NULL DEFAULT 'pending'`,
    );
    await queryRunner.query(`
            ALTER TABLE \`user_status\`
            ADD CONSTRAINT \`FK_user_status_user\`
            FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`)
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE \`user_status\`
            ADD CONSTRAINT \`FK_user_status_school\`
            FOREIGN KEY (\`schoolId\`) REFERENCES \`school\`(\`id\`)
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user_status\` DROP FOREIGN KEY \`FK_user_status_user\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_status\` DROP FOREIGN KEY \`FK_user_status_school\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_status\` CHANGE \`accountStatus\` \`status\` varchar(255) NOT NULL DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_status\` RENAME INDEX \`IDX_user_status_user_school\` TO \`IDX_school_user_status_user_school\``,
    );
    await queryRunner.query(
      `RENAME TABLE \`user_status\` TO \`school_user_status\``,
    );
    await queryRunner.query(`
            ALTER TABLE \`school_user_status\`
            ADD CONSTRAINT \`FK_school_user_status_user\`
            FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`)
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE \`school_user_status\`
            ADD CONSTRAINT \`FK_school_user_status_school\`
            FOREIGN KEY (\`schoolId\`) REFERENCES \`school\`(\`id\`)
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }
}
