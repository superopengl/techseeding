import * as axios from 'axios';

const apiEndpoint = ''

async function request(method, path, queryParams, body) {
  try {
    const response = await axios({
      method,
      baseURL: apiEndpoint,
      url: `${apiEndpoint}/${path}`,
      headers: {
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip, compress, deflate'
      },
      params: queryParams,
      data: body,
      responseType: 'json'
    });

    return response.data;
  } catch (e) {
    console.error(e);
  }
}

export const httpGet = async (path, params) => request('GET', path, params);
export const httpPost = async (path, body, params) => request('POST', path, params, body);
export const httpPut = async (path, body, params) => request('PUT', path, params, body);
export const httpDelete = async (path, body, params) => request('DELETE', path, params, body);
