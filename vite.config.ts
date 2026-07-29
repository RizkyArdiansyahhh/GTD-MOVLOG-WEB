import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './resources/js'),
        },
    },
    server: {
        host: '0.0.0.0',   // listen on all interfaces inside Docker
        port: 5174,
        strictPort: true,   // fail instead of silently switching ports
        watch: {
            usePolling: true,
            interval: 1000,
            ignored: ['**/node_modules/**', '**/vendor/**', '**/storage/**'],
        },
        hmr: {
            host: 'localhost', // browser connects via localhost
            port: 5174,
        },
    },
});
