import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("mconv_converts")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("direction", "varchar", (col) => col.notNull())
    .addColumn("status", "varchar", (col) => col.notNull())
    .addColumn("file_hash", "varchar", (col) => col.notNull())
    .addColumn("message", "varchar")
    .addColumn("download_url", "varchar")
    .addColumn("created_at", "timestamp", (col) => col.defaultTo(sql`now()`).notNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("mconv_converts").execute();
}
