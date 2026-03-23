import axios from 'axios';


const API = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true
})

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if(token){
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

API.interceptors.response.use(
    (response) => response,
    async(error) => {
        const original = error.config;

        if(error.response?.status === 401 && !original._retry){
            original._retry = true;
            try {

                // Use axios directly to avoid interceptor recursion
                const res = await axios.post('http://localhost:5000/api/auth/refresh', {}, {
                    withCredentials: true
                });

                const newToken = res.data.accessToken;
                localStorage.setItem('accessToken', newToken);
                original.headers.Authorization = `Bearer ${newToken}`;

                return API(original);
                
            } catch (refreshError) {
                localStorage.removeItem('accessToken');
                // Don't use window.location - let React Router handle navigation
                // The app will redirect to login when user is null
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
)

export default API;