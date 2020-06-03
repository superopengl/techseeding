import * as axios from 'axios';

function trimSlash(str) {
  return str ? str.replace(/^\/+/, '').replace(/\/+$/, '') : str;
}

const baseURL = trimSlash(process.env.REACT_APP_UBC_API_ENDPOINT);

async function request(method, path, queryParams, body) {
  try {
    const response = await axios({
      method,
      baseURL,
      url: `${baseURL}/${trimSlash(path)}`,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept-Encoding': 'gzip, compress, deflate',
        'Authorization': 'Basic ubc.techseeding'
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

export const httpGet = async (path, querParams = null) => request('GET', path, querParams);
export const httpPost = async (path, body, querParams = null) => request('POST', path, querParams, body);
export const httpPut = async (path, body, querParams = null) => request('PUT', path, querParams, body);
export const httpDelete = async (path, body = null, querParams = null) => request('DELETE', path, querParams, body);
