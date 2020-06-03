import data from './fake'
import { httpGet, httpPost, httpDelete } from './http';

export async function getGallery(id) {
  return httpGet(`gallery/${id}`);
}

export async function saveGallery(gallery) {
  return httpPost('gallery', gallery);
}

export async function deleteGallery(id) {
  return httpDelete(`gallery/${id}`);
}

export async function listGallery() {
  return httpGet('gallery');
}
