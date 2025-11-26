import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const helloWorld = async (userName) => {
    const res = await API.post('/helloworld', {userName});
    return res;
};
