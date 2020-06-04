import * as axios from 'axios';
import { message } from 'antd';

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
        'Authorization': 'Basic ubc.techseeding'
      },
      params: queryParams,
      data: body,
      responseType: 'json'
    });

    return response.data;
  } catch (e) {
    message.error({ content: e.message, key: e.message, duration: 10 });
  }
}

export const httpGet = async (path, queryParams = null) => request('GET', path, queryParams);
export const httpPost = async (path, body, queryParams = null) => request('POST', path, queryParams, body);
export const httpPut = async (path, body, queryParams = null) => request('PUT', path, queryParams, body);
export const httpDelete = async (path, body = null, queryParams = null) => request('DELETE', path, queryParams, body);
