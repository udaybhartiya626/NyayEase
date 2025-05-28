import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: 'https://nyay-ease.vercel.app/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Include cookies in requests
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log outgoing requests in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`,
        config.method !== 'get' ? config.data : '');
    }

    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    // Log responses in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`API Response: ${response.status} ${response.config.url}`,
        response.data);
    }
    return response;
  },
  (error) => {
    // Log response errors
    console.error('API Response Error:', error.response?.status, error.response?.data || error.message);

    // Handle 401 (Unauthorized) - redirect to login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api; 