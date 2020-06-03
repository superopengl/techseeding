
import { getRepository } from 'typeorm';
import { Business } from '../entity/Business';
import { createGet, createSave, createDelete } from './genericControllerFactory';

export const listBusiness = async (req, res) => {
  const { group } = req.params;
  const repo = getRepository(Business);

  let query = await repo.createQueryBuilder('x');
  if (group) {
    query = query.where('x.group = :group', { group });
  }
  const list = await query.orderBy('x.ordinal', 'ASC', 'NULLS LAST')
    .addOrderBy('x.createdAt', 'ASC')
    .getMany();

  res.json(list);
};
export const getBusiness = createGet(Business);
export const saveBusiness = createSave(Business);
export const deleteBusiness = createDelete(Business);