import { createConnection, getRepository, getConnectionManager, Repository } from 'typeorm';
import { Picture } from '../entity/Picture';

export class PictureController {
  private repository: Repository<Picture>;

  constructor() {
    this.repository = getRepository(Picture);
  }

  async get(id: string) {
    return await this.repository.findOne(id);
  }

  async create(picture: Picture) {
    return await this.repository.save(picture);
  }
}