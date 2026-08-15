import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCalendarNote1784501000000 implements MigrationInterface {
    name = 'AddCalendarNote1784501000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`calendar_note\` (\`id\` int NOT NULL AUTO_INCREMENT, \`date\` varchar(255) NOT NULL, \`note\` varchar(255) NOT NULL, \`schoolId\` int NULL, INDEX \`IDX_calendar_note_date\` (\`date\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`calendar_note\` ADD CONSTRAINT \`FK_calendar_note_school\` FOREIGN KEY (\`schoolId\`) REFERENCES \`school\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`calendar_note\` DROP FOREIGN KEY \`FK_calendar_note_school\``);
        await queryRunner.query(`DROP INDEX \`IDX_calendar_note_date\` ON \`calendar_note\``);
        await queryRunner.query(`DROP TABLE \`calendar_note\``);
    }

}
