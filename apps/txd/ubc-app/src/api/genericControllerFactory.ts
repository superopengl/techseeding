
import { getRepository } from 'typeorm';
import { assert } from '../utils';
import { v4 as uuidv4 } from 'uuid';

export function createList(entityType) {
  return async (req, res) => {
    const repo = getRepository(entityType);
    const entities = await repo.createQueryBuilder('x')
      // .select(['x.id'])
      .orderBy('x.ordinal', 'ASC', 'NULLS LAST')
      .addOrderBy('x.createdAt', 'ASC')
      .getMany();
    // const list = entities.map(x => (x as any).id);
    res.json(entities);
  };
}

export function createGet(entityType) {
  return async (req, res) => {
    const { id } = req.params;
    const repo = getRepository(entityType);
    const item = await repo.findOne(id);
    assert(item, 404);
    res.json(item);
  };
}

export function createSave(entityType) {
  return async (req, res) => {
    const entity = Object.assign({ id: uuidv4() }, req.body); // Allocate id if not specified.
    const repo = getRepository(entityType);
    await repo.save(entity);
    res.sendStatus(200);
  };
}

export function createDelete(entityType) {
  return async (req, res) => {
    const { id } = req.params;
    const repo = getRepository(entityType);
    await repo.delete({ id });
    res.sendStatus(200);
  };
}