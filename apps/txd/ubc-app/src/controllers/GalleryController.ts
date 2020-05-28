import { createConnection, getRepository, getConnectionManager, Repository } from 'typeorm';
import { Gallery } from '../entity/Gallery';
import { assert } from '../utils/assert';

export class GalleryController {
  private repository: Repository<Gallery>;

  constructor() {
    this.repository = getRepository(Gallery);
  }

  async get(id: string): Promise<Gallery> {
    return this.repository.findOne(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return !!result.affected;
  }

  async list(limit?: number): Promise<Gallery[]> {
    let query = this.repository.createQueryBuilder('p');
    if (limit > 0) {
      query = query.limit(limit);
    }
    query.orderBy('ordinal', 'ASC');

    const list = await query.execute();
    return list;
  }

  async create(item: Gallery) {
    assert(item, 400, 'Gallery is not specified');
    return await this.repository.insert(item);
  }

  async update(item: Gallery) {
    assert(item, 400, 'Gallery is not specified');
    return await this.repository.save(item);
  }
}