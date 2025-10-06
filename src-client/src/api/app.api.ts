import { API, API_URL } from '.';

const BASE_URL = '/app';

export async function appExit() {
  return API.get(`${BASE_URL}/exit`);
}

export async function appUpdate() {
  const apiPath = `${API_URL}${BASE_URL}/update`;
  return new EventSource(apiPath);
}

export async function appCheckUpdate() {
  return API.get<any>(`${BASE_URL}/update/check`);
}
