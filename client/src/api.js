import axios from 'axios';

const API = axios.axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'localhost:5000/api'
});
API.interceptors.request.use(config =>{
    const token = localStorage.getItem('token');
    if(token) config.headers.Authorization= 'Bearer ${token}'
    return config;
});
export default API;