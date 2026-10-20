import axios from 'axios';

window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// 1. Izinkan Axios mengirimkan cookies/credentials
window.axios.defaults.withCredentials = true;

// 2. Aktifkan auto-read token dari cookie XSRF-TOKEN bawaan Laravel
window.axios.defaults.withXSRFToken = true;

// Do not pin X-CSRF-TOKEN to the initial HTML meta tag: it becomes stale
// after session expiry and takes precedence over the refreshed XSRF cookie.
// Web/Inertia 419 recovery uses the server's GET redirect + flash toast.
// JSON failures stay with their caller; never reload or replay them globally.
