import { useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import type { PageProps } from '@/types';

(window as any).Pusher = Pusher;

export function useRealtimeUpdates(customCustomerId?: string) {
    const { auth } = usePage<PageProps>().props;
    const customerId = customCustomerId || auth?.user?.customer?.id;

    useEffect(() => {
        if (!customerId) {
            return;
        }

        const reverbKey = import.meta.env.VITE_REVERB_APP_KEY;
        const reverbHost = import.meta.env.VITE_REVERB_HOST || window.location.hostname;
        const reverbPort = import.meta.env.VITE_REVERB_PORT ? Number(import.meta.env.VITE_REVERB_PORT) : 8080;
        const reverbScheme = import.meta.env.VITE_REVERB_SCHEME || 'http';

        let echo: Echo<'reverb'> | null = null;

        try {
            echo = new Echo({
                broadcaster: 'reverb',
                key: reverbKey,
                wsHost: reverbHost,
                wsPort: reverbPort,
                wssPort: reverbPort,
                forceTLS: reverbScheme === 'https',
                enabledTransports: ['ws', 'wss'],
            });

            const channelName = `customer.${customerId}`;
            const channel = echo.private(channelName);

            channel.listen('.shipment.updated', (event: any) => {
                console.log('[GTD Realtime] shipment.updated received:', event);
                router.reload({
                    only: ['recentShipments', 'stats', 'checkpointGroups', 'shipments', 'shipment', 'timeline', 'units'],
                });
            });

            channel.listen('.checkpoint.progress', (event: any) => {
                console.log('[GTD Realtime] checkpoint.progress received:', event);
                router.reload({
                    only: ['recentShipments', 'stats', 'checkpointGroups', 'shipments', 'shipment', 'timeline'],
                });
            });

            channel.listen('.document.verified', (event: any) => {
                console.log('[GTD Realtime] document.verified received:', event);
                router.reload({
                    only: ['recentShipments', 'documents', 'shipment'],
                });
            });
        } catch (error) {
            console.warn('[GTD Realtime] Echo initialization error:', error);
        }

        return () => {
            if (echo) {
                echo.leave(`customer.${customerId}`);
                echo.disconnect();
            }
        };
    }, [customerId]);
}
