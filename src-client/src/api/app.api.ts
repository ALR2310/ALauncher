import { API } from '.';

const BASE_URL = '/app';

export async function appExit() {
  return API.get(`${BASE_URL}/exit`);
}
