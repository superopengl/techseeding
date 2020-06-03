
import * as aws from 'aws-sdk';
import { createConnection, getRepository, getConnectionManager, Repository } from 'typeorm';
import { Image } from '../entity/Image';
import { assert } from '../utils';
import { v4 as uuidv4 } from 'uuid';
import { Gallery } from '../entity/Gallery';

export async function listGallery(req, res) {
  const repo = getRepository(Gallery);
  const list = await repo.find();
  res.json(list);
}

export async function getGallery(req, res) {
  const { galleryId } = req.params;
  const repo = getRepository(Gallery);
  const gallery = await repo.findOne(galleryId);
  assert(gallery, 404);
  res.json(gallery);
}

export async function createGallery(req, res) {
  const gallary = Object.assign({ id: uuidv4() }, req.body); // Allocate id if not specified.
  const repo = getRepository(Gallery);
  await repo.save(gallary);
  res.sendStatus(200);
}

export async function deleteGallery(req, res) {
  const { galleryId } = req.params;
  const repo = getRepository(Gallery);
  await repo.delete(galleryId);
  res.sendStatus(200);
}