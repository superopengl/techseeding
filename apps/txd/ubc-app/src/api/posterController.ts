
import { Poster } from '../entity/Poster';
import { createList, createGet, createSave, createDelete } from './genericControllerFactory';

export const listPoster = createList(Poster);
export const getPoster = createGet(Poster);
export const savePoster = createSave(Poster);
export const deletePoster = createDelete(Poster);