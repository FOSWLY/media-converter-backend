import { db } from "../database";
import { ConvertUpdate, Convert, NewConvert, GetConvertOpts } from "../../schemas/convert";
import BaseRepository from "./base";

export default class ConvertRepository extends BaseRepository {
  constructor() {
    super("mconv_converts");
  }

  async get({ direction, file_hash }: GetConvertOpts) {
    const query = db
      .selectFrom(this.dbName)
      .where("direction", "=", direction)
      .where("file_hash", "=", file_hash);

    return await query.selectAll().executeTakeFirst();
  }

  async getAll(criteria: Partial<Convert> = {}) {
    let query = db.selectFrom(this.dbName);

    if (criteria.id) {
      query = query.where("id", "=", criteria.id); // Kysely is immutable, you must re-assign!
    }

    if (criteria.direction) {
      query = query.where("direction", "=", criteria.direction);
    }

    if (criteria.status) {
      query = query.where("status", "=", criteria.status);
    }

    if (criteria.file_hash) {
      query = query.where("file_hash", "=", criteria.file_hash);
    }

    if (criteria.message !== undefined) {
      query = query.where("message", criteria.message === null ? "is" : "=", criteria.message);
    }

    if (criteria.download_url !== undefined) {
      query = query.where(
        "download_url",
        criteria.download_url === null ? "is" : "=",
        criteria.download_url,
      );
    }

    if (criteria.created_at) {
      query = query.where("created_at", "=", criteria.created_at);
    }

    return await query.selectAll().execute();
  }

  async update({ direction, file_hash }: GetConvertOpts, updateWith: ConvertUpdate) {
    await db
      .updateTable(this.dbName)
      .set(updateWith)
      .where("direction", "=", direction)
      .where("file_hash", "=", file_hash)
      .execute();
  }

  async create(convert: NewConvert) {
    return await db
      .insertInto(this.dbName)
      .values(convert)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async delete({ direction, file_hash }: GetConvertOpts) {
    return await db
      .deleteFrom(this.dbName)
      .where("direction", "=", direction)
      .where("file_hash", "=", file_hash)
      .returningAll()
      .executeTakeFirst();
  }

  async deleteById(id: number) {
    return await db.deleteFrom(this.dbName).where("id", "=", id).returningAll().executeTakeFirst();
  }

  async deleteByLessTime(created_at: Date) {
    return await db
      .deleteFrom(this.dbName)
      .where("created_at", "<", created_at)
      .returningAll()
      .execute();
  }
}
