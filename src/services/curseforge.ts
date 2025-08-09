import axios from 'axios';

const API_KEY = import.meta.env.VITE_CURSEFORGE_API_KEY;

const api = axios.create({
  baseURL: 'https://api.curseforge.com/v1',
  headers: {
    'x-api-key': API_KEY,
  },
});

export const getVersion = async () => {
  const response = await api.get('minecraft/version');
  return response.data.data;
};
