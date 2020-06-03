import { httpGet, httpPost, httpDelete } from './http';

export async function getBusiness(id) {
  return httpGet(`business/${id}`);
}

export async function saveBusiness(gallery) {
  return httpPost('business', gallery);
}

export async function deleteBusiness(id) {
  return httpDelete(`business/${id}`);
}

export async function listBusiness(group = null) {
  return httpGet('business', { group });
}