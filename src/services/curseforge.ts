import axios from 'axios';

const API_KEY = import.meta.env.VITE_CURSEFORGE_API_KEY;

const api = axios.create({
  baseURL: 'https://api.curseforge.com/v1',
  headers: {
    'x-api-key': API_KEY,
  },
});

export const fetchVersion = async () => {
  const response = await api.get('minecraft/version');
  return response.data.data;
};

export const fetchVersionLoader = async (params: { version: string }) => {
  const response = await api.get(`minecraft/modloader?version=${params.version}&includeAll=true`);
  return response.data.data;
};
