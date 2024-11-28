import { Convert, ConvertUpdate, GetConvertOpts } from "@/schemas/convert";
import { MediaDirection, mediaDirections } from "@/types/convert";
import { cache } from "../cache";
import BaseRepository from "./base";

export default class ConvertRepository extends BaseRepository {
  repositoryName = "convert";

  private getKey(direction: MediaDirection) {
    return `${this.prefix}:${this.repositoryName}:${direction}`;
  }

  async get({ direction, file_hash }: GetConvertOpts): Promise<undefined | Convert> {
    const result = await cache.hget(this.getKey(direction), file_hash);

    return result ? (JSON.parse(result) as Convert) : undefined;
  }

  async getAll(criteria: Partial<Convert> = {}) {
    let directions: MediaDirection[] = mediaDirections;
    if (criteria.direction) {
      directions = directions.filter((direction) => direction === criteria.direction);
    }

    const result = [];
    for await (const direction of directions) {
      const cached = await cache.hgetall(this.getKey(direction));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const [_, val] of Object.entries(cached)) {
        const data = JSON.parse(val) as Convert;
        if (
          (criteria.id && data.id !== criteria.id) ??
          (criteria.file_hash && data.file_hash !== criteria.file_hash) ??
          (criteria.message && data.message !== criteria.message) ??
          (criteria.download_url && data.download_url !== criteria.download_url) ??
          (criteria.created_at && data.created_at !== criteria.created_at)
        ) {
          continue;
        }

        result.push(data);
      }
    }

    return result;
  }

  async update(getBy: GetConvertOpts, updateWith: ConvertUpdate) {
    const res = await this.get(getBy);
    if (!res) {
      return;
    }

    await this.create({
      ...res,
      ...updateWith,
    });
  }

  async create(convert: Convert) {
    const { direction, file_hash } = convert;
    const hashKey = this.getKey(direction);
    await cache.hset(hashKey, {
      [file_hash]: JSON.stringify(convert),
    });
    await cache.expire(hashKey, this.ttl);
  }

  async delete({ direction, file_hash }: GetConvertOpts) {
    return await cache.hdel(this.getKey(direction), file_hash);
  }
}
