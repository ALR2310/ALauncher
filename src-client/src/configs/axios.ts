import axios from 'axios';

const api = axios.create({
  baseURL: `http://localhost:${import.meta.env.VITE_SERVER_PORT ?? 1421}/api`,
});

export default api;
