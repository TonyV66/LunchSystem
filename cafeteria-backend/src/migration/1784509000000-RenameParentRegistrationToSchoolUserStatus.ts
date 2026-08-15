import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameParentRegistrationToSchoolUserStatus1784509000000
  implements MigrationInterface
{
  name = "RenameParentRegistrationToSchoolUserStatus1784509000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`parent_registration\` DROP FOREIGN KEY \`FK_parent_registration_user\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`parent_registration\` DROP FOREIGN KEY \`FK_parent_registration_school\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`parent_registration\` RENAME INDEX \`IDX_parent_registration_user_school\` TO \`IDX_school_user_status_user_school\``,
    );
    await queryRunner.query(
      `RENAME TABLE \`parent_registration\` TO \`school_user_status\``,
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`school_user_status\` DROP FOREIGN KEY \`FK_school_user_status_user\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`school_user_status\` DROP FOREIGN KEY \`FK_school_user_status_school\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`school_user_status\` RENAME INDEX \`IDX_school_user_status_user_school\` TO \`IDX_parent_registration_user_school\``,
    );
    await queryRunner.query(
      `RENAME TABLE \`school_user_status\` TO \`parent_registration\``,
    );
    await queryRunner.query(`
            ALTER TABLE \`parent_registration\`
            ADD CONSTRAINT \`FK_parent_registration_user\`
            FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`)
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE \`parent_registration\`
            ADD CONSTRAINT \`FK_parent_registration_school\`
            FOREIGN KEY (\`schoolId\`) REFERENCES \`school\`(\`id\`)
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }
}
