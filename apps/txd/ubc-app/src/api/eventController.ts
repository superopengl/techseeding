
import * as aws from 'aws-sdk';
import { createConnection, getRepository, getConnectionManager, Repository } from 'typeorm';
import { Image } from '../entity/Image';
import { assert } from '../utils';
import { v4 as uuidv4 } from 'uuid';
import { Event } from '../entity/Event';
import { createList, createGet, createSave, createDelete } from './genericControllerFactory';

export const listEvent = createList(Event);
export const getEvent = createGet(Event);
export const saveEvent = createSave(Event);
export const deleteEvent = createDelete(Event);