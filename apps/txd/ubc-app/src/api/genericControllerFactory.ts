
import * as aws from 'aws-sdk';
import { createConnection, getRepository, getConnectionManager, Repository } from 'typeorm';
import { Image } from '../entity/Image';
import { assert } from '../utils';
import { v4 as uuidv4 } from 'uuid';
import { Poster } from '../entity/Poster';

export function createList(typeFunc) {
  return async (req, res) => {
    const repo = getRepository(typeFunc());
    const entities = await repo.createQueryBuilder('x')
      // .select(['x.id'])
      .orderBy('x.ordinal', 'ASC', 'NULLS LAST')
      .addOrderBy('x.createdAt', 'ASC')
      .getMany();
    // const list = entities.map(x => (x as any).id);
    res.json(entities);
  };
}

export function createGet(typeFunc) {
  return async (req, res) => {
    const { id } = req.params;
    const repo = getRepository(typeFunc());
    const gallery = await repo.findOne(id);
    assert(gallery, 404);
    res.json(gallery);
  };
}

export function createSave(typeFunc) {
  return async (req, res) => {
    const entity = Object.assign({ id: uuidv4() }, req.body); // Allocate id if not specified.
    const repo = getRepository(typeFunc());
    await repo.save(entity);
    res.sendStatus(200);
  };
}

export function createDelete(typeFunc) {
  return async (req, res) => {
    const { id } = req.params;
    const repo = getRepository(typeFunc());
    const result = await repo.delete({ id });
    res.sendStatus(200);
  };
}