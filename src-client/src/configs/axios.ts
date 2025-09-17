import axios from 'axios';

const api = axios.create({
  baseURL: `http://localhost:${import.meta.env.VITE_SERVER_PORT}/api`,
});

export default api;
