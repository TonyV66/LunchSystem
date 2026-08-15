import { MigrationInterface, QueryRunner, TableIndex } from "typeorm";

export class DropUserExternalIdDescriptionAndUniqueUserName1784511000000
  implements MigrationInterface
{
  name = "DropUserExternalIdDescriptionAndUniqueUserName1784511000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("user");
    if (table?.findColumnByName("externalId")) {
      await queryRunner.query(
        `ALTER TABLE \`user\` DROP COLUMN \`externalId\``,
      );
    }
    if (table?.findColumnByName("description")) {
      await queryRunner.query(
        `ALTER TABLE \`user\` DROP COLUMN \`description\``,
      );
    }

    const refreshedTable = await queryRunner.getTable("user");
    const userNameIndexes =
      refreshedTable?.indices.filter((index) =>
        index.columnNames.includes("userName"),
      ) ?? [];
    const hasUniqueUserNameIndex = userNameIndexes.some(
      (index) => index.isUnique,
    );

    for (const index of userNameIndexes) {
      // Keep an existing unique index; replace non-unique ones.
      if (index.isUnique) {
        continue;
      }
      await queryRunner.dropIndex("user", index);
    }

    if (!hasUniqueUserNameIndex) {
      await queryRunner.createIndex(
        "user",
        new TableIndex({
          name: "IDX_user_userName",
          columnNames: ["userName"],
          isUnique: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("user");
    const uniqueUserNameIndexes =
      table?.indices.filter(
        (index) => index.columnNames.includes("userName") && index.isUnique,
      ) ?? [];
    for (const index of uniqueUserNameIndexes) {
      await queryRunner.dropIndex("user", index);
    }

    await queryRunner.createIndex(
      "user",
      new TableIndex({
        name: "IDX_user_userName",
        columnNames: ["userName"],
        isUnique: false,
      }),
    );

    const refreshedTable = await queryRunner.getTable("user");
    if (!refreshedTable?.findColumnByName("description")) {
      await queryRunner.query(
        `ALTER TABLE \`user\` ADD \`description\` varchar(255) NOT NULL DEFAULT ''`,
      );
    }
    if (!refreshedTable?.findColumnByName("externalId")) {
      await queryRunner.query(
        `ALTER TABLE \`user\` ADD \`externalId\` varchar(255) NOT NULL DEFAULT ''`,
      );
    }
  }
}
