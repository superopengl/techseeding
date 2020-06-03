import data from './fake'
import { httpGet, httpPost } from './http';

export function getGalleryList() {
  return httpGet('gallery');
}

export async function getGallery(id) {
  return httpGet(`gallery/${id}`);
}

export async function saveGallery(gallery) {
  return httpPost('gallery', gallery);
}