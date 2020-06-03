import data from './fake'
import { httpGet, httpPost, httpDelete } from './http';

export function getPosterList() {
  return data.poster;
}

export async function getPoster(id) {
  return httpGet(`poster/${id}`);
}

export async function savePoster(gallery) {
  return httpPost('poster', gallery);
}

export async function deletePoster(id) {
  return httpDelete(`poster/${id}`);
}

export async function listPoster() {
  return httpGet('poster');
}