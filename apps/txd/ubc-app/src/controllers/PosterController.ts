import { createConnection, getRepository, getConnectionManager, Repository } from 'typeorm';
import { Poster } from '../entity/Poster';
import { Picture } from '../entity/Picture';
import { assert } from '../utils/assert';

export class PosterController {
  private repository: Repository<Poster>;

  constructor() {
    this.repository = getRepository(Poster);
  }

  async get(id: string): Promise<Poster> {
    return this.repository.findOne(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return !!result.affected;
  }

  async list(limit?: number): Promise<Poster[]> {
    let query = this.repository.createQueryBuilder('p');
    if (limit > 0) {
      query = query.limit(limit);
    }
    query.orderBy('ordinal', 'ASC');

    const list = await query.execute();
    return list;
  }

  async create(poster: Poster) {
    assert(poster, 400, 'poster is not specified');
    return await this.repository.insert(poster);
  }

  async update(poster: Poster) {
    assert(poster, 400, 'poster is not specified');
    return await this.repository.save(poster);
  }
}