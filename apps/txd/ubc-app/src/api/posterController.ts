
import * as aws from 'aws-sdk';
import { createConnection, getRepository, getConnectionManager, Repository } from 'typeorm';
import { Image } from '../entity/Image';
import { assert } from '../utils';
import { v4 as uuidv4 } from 'uuid';
import { Poster } from '../entity/Poster';
import { createList, createGet, createSave, createDelete } from './genericControllerFactory';

export const listPoster = createList(Poster);
export const getPoster = createGet(Poster);
export const savePoster = createSave(Poster);
export const deletePoster = createDelete(Poster);