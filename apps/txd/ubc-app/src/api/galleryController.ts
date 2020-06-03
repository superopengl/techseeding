
import * as aws from 'aws-sdk';
import { createConnection, getRepository, getConnectionManager, Repository } from 'typeorm';
import { Image } from '../entity/Image';
import { assert } from '../utils';
import { v4 as uuidv4 } from 'uuid';
import { Gallery } from '../entity/Gallery';
import { createList, createGet, createSave, createDelete } from './genericControllerFactory';

export const listGallery = createList(Gallery);
export const getGallery = createGet(Gallery);
export const saveGallery = createSave(Gallery);
export const deleteGallery = createDelete(Gallery);