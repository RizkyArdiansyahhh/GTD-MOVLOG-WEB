import axios from 'axios';

window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// 1. Izinkan Axios mengirimkan cookies/credentials
window.axios.defaults.withCredentials = true;

// 2. Aktifkan auto-read token dari cookie XSRF-TOKEN bawaan Laravel
window.axios.defaults.withXSRFToken = true;

// 3. Fallback jika membaca dari meta tag
const token = document.head.querySelector('meta[name="csrf-token"]');
if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
}

// 4. Interceptor: Jika terjadi error 419 (CSRF Mismatch), reload halaman otomatis
window.axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 419) {
            console.warn('Session expired or CSRF token mismatch. Reloading page...');
            window.location.reload();
        }
        return Promise.reject(error);
    }
);
