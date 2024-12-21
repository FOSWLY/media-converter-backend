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

    const cachedResults = await Promise.all(
      directions.map((direction) => cache.hgetall(this.getKey(direction))),
    );

    const result = cachedResults.reduce((result, cached) => {
      const converts: Convert[] = Object.values(cached)
        .map((value) => {
          const data = JSON.parse(value) as Convert;
          if (
            (criteria.id && data.id !== criteria.id) ??
            (criteria.file_hash && data.file_hash !== criteria.file_hash) ??
            (criteria.message && data.message !== criteria.message) ??
            (criteria.download_url && data.download_url !== criteria.download_url) ??
            (criteria.created_at && data.created_at !== criteria.created_at)
          ) {
            return false;
          }

          return data;
        })
        .filter((value) => value !== false);

      if (converts) {
        result.push(...converts);
      }

      return result;
    }, [] as Convert[]);

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
