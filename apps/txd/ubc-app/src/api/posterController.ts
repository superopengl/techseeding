
import * as aws from 'aws-sdk';
import { createConnection, getRepository, getConnectionManager, Repository } from 'typeorm';
import { Image } from '../entity/Image';
import { assert } from '../utils';
import { v4 as uuidv4 } from 'uuid';
import { Poster } from '../entity/Poster';
import { createList, createGet, createSave, createDelete } from './genericControllerFactory';

const typeFunc = () => Poster;

export const listPoster = createList(typeFunc);

export const getPoster = createGet(typeFunc);
export const savePoster = createSave(typeFunc);

export const deletePoster = createDelete(typeFunc);