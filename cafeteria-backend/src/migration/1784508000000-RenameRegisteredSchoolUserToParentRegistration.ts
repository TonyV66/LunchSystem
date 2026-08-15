import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameRegisteredSchoolUserToParentRegistration1784508000000
  implements MigrationInterface
{
  name = "RenameRegisteredSchoolUserToParentRegistration1784508000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`registered_school_user\` DROP FOREIGN KEY \`FK_registered_school_user_user\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`registered_school_user\` DROP FOREIGN KEY \`FK_registered_school_user_school\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`registered_school_user\` RENAME INDEX \`IDX_registered_school_user_user_school\` TO \`IDX_parent_registration_user_school\``,
    );
    await queryRunner.query(
      `RENAME TABLE \`registered_school_user\` TO \`parent_registration\``,
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`parent_registration\` DROP FOREIGN KEY \`FK_parent_registration_user\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`parent_registration\` DROP FOREIGN KEY \`FK_parent_registration_school\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`parent_registration\` RENAME INDEX \`IDX_parent_registration_user_school\` TO \`IDX_registered_school_user_user_school\``,
    );
    await queryRunner.query(
      `RENAME TABLE \`parent_registration\` TO \`registered_school_user\``,
    );
    await queryRunner.query(`
            ALTER TABLE \`registered_school_user\`
            ADD CONSTRAINT \`FK_registered_school_user_user\`
            FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`)
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE \`registered_school_user\`
            ADD CONSTRAINT \`FK_registered_school_user_school\`
            FOREIGN KEY (\`schoolId\`) REFERENCES \`school\`(\`id\`)
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }
}
