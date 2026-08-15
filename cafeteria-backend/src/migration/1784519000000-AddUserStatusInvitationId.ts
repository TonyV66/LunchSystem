import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserStatusInvitationId1784519000000
  implements MigrationInterface
{
  name = "AddUserStatusInvitationId1784519000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`user_status\`
      ADD \`invitationId\` varchar(255) NULL
    `);
    await queryRunner.query(`
      CREATE INDEX \`IDX_user_status_invitationId\` ON \`user_status\` (\`invitationId\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX \`IDX_user_status_invitationId\` ON \`user_status\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`user_status\`
      DROP COLUMN \`invitationId\`
    `);
  }
}
