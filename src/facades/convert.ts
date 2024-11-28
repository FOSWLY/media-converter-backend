import ConvertCacheRepository from "@/cache/repositories/convert";
import ConvertDBRepository from "@/database/repositories/convert";
import { GetConvertOpts, NewConvert, Convert, ConvertUpdate } from "@/schemas/convert";
import BaseFacade from "./base";

export default class ConvertFacade extends BaseFacade<ConvertCacheRepository, ConvertDBRepository> {
  constructor() {
    super(new ConvertCacheRepository(), new ConvertDBRepository());
  }

  async get(getBy: GetConvertOpts): Promise<Convert | undefined> {
    const cached = await this.cacheRepository.get(getBy);
    if (cached) {
      return cached;
    }

    const result = (await this.dbRepository.get(getBy)) as Convert | undefined;
    if (result) {
      await this.cacheRepository.create(result);
    }

    return result;
  }

  async getAll(criteria: Partial<Convert>): Promise<Convert[]> {
    const cached = await this.cacheRepository.getAll(criteria);
    if (cached) {
      return cached;
    }

    return (await this.dbRepository.getAll(criteria)) as Convert[];
  }

  async update(getBy: GetConvertOpts, updateWith: ConvertUpdate): Promise<boolean> {
    await this.dbRepository.update(getBy, updateWith);
    const result = await this.dbRepository.get({
      direction: updateWith.direction ?? getBy.direction,
      file_hash: updateWith.file_hash ?? getBy.file_hash,
    });
    if (!result) {
      await this.cacheRepository.delete(getBy);
      return false;
    }

    await this.cacheRepository.update(getBy, result);
    return true;
  }

  async create(convert: NewConvert): Promise<Convert | undefined> {
    const result = await this.dbRepository.create(convert);
    if (!result) {
      return result;
    }

    await this.cacheRepository.create(result as Convert);
    return result as Convert;
  }

  async delete(getBy: GetConvertOpts): Promise<Convert | undefined> {
    const result = await this.dbRepository.delete(getBy);
    await this.cacheRepository.delete(getBy);

    return result as Convert | undefined;
  }

  async deleteByLessTime(created_at: Date): Promise<Convert[] | undefined> {
    const result = await this.dbRepository.deleteByLessTime(created_at);
    if (!result) {
      return;
    }

    for (const convert of result) {
      const { direction, file_hash } = convert as Convert;
      await this.cacheRepository.delete({
        direction,
        file_hash,
      });
    }

    return result as Convert[];
  }

  async deleteById(id: number): Promise<Convert | undefined> {
    const result = await this.dbRepository.deleteById(id);
    if (!result) {
      return;
    }

    const { direction, file_hash } = result as Convert;
    await this.cacheRepository.delete({
      direction,
      file_hash,
    });

    return result as Convert;
  }
}
