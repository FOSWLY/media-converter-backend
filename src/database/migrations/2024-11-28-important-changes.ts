import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("mconv_converts")
    .alterColumn("id", (col) => col.dropDefault())
    .alterColumn("id", (col) => col.setDataType("bigint"))
    .alterColumn("created_at", (col) => col.setDataType("timestamptz"))
    .execute();

  await sql`ALTER TABLE mconv_converts DROP CONSTRAINT IF EXISTS mconv_converts_pkey`.execute(db);
  await sql`ALTER TABLE mconv_converts ALTER id ADD GENERATED ALWAYS AS IDENTITY`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("mconv_converts")
    .alterColumn("id", (col) => col.setDataType("serial"))
    .alterColumn("created_at", (col) => col.setDataType("timestamp"))
    .execute();

  await sql`ALTER TABLE mconv_converts ADD CONSTRAINT mconv_converts_pkey PRIMARY KEY ("id");`.execute(
    db,
  );
}
