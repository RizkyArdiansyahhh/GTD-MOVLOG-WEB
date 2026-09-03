import { useEffect, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';

interface ToastItem {
    id: number;
    type: 'success' | 'error';
    title: string;
    message?: string;
}

let nextId = 0;

// ── Styles ────────────────────────────────────────────────────────────────
const BG: Record<ToastItem['type'], string> = {
    success: '#16a34a',
    error: '#dc2626',
};
const SHADOW: Record<ToastItem['type'], string> = {
    success: '0 8px 24px rgba(22, 163, 74, 0.28)',
    error: '0 8px 24px rgba(220, 38, 38, 0.28)',
};
const TITLE: Record<ToastItem['type'], string> = {
    success: 'Success',
    error: 'Error',
};

// ── Single toast card ─────────────────────────────────────────────────────
function ToastCard({ item, onDone }: { item: ToastItem; onDone: (id: number) => void }) {
    const [visible, setVisible] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // Slide in
        const show = requestAnimationFrame(() => setVisible(true));

        // After 4 s, slide out then remove
        timerRef.current = setTimeout(() => {
            setVisible(false);
            setTimeout(() => onDone(item.id), 280); // wait for exit anim
        }, 4000);

        return () => {
            cancelAnimationFrame(show);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [item.id, onDone]);

    return (
        <div
            role="alert"
            aria-live="polite"
            style={{
                background: BG[item.type],
                borderRadius: '10px',
                padding: '13px 16px',
                boxShadow: SHADOW[item.type],
                maxWidth: '340px',
                width: 'calc(100vw - 32px)',
                transform: visible ? 'translateX(0)' : 'translateX(120%)',
                opacity: visible ? 1 : 0,
                transition: 'transform 250ms ease-out, opacity 250ms ease-out',
                cursor: 'pointer',
            }}
            onClick={() => {
                setVisible(false);
                setTimeout(() => onDone(item.id), 280);
            }}
        >
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'white', margin: 0 }}>
                {item.title}
            </p>
            {item.message && (
                <p
                    style={{
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.82)',
                        margin: '3px 0 0',
                        lineHeight: 1.45,
                    }}
                >
                    {item.message}
                </p>
            )}
        </div>
    );
}

// ── Toast container (reads from Inertia flash props) ──────────────────────
export default function Toast() {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const prevRef = useRef<{ success?: string; error?: string }>({});

    useEffect(() => {
        const prev = prevRef.current;
        const added: ToastItem[] = [];

        if (flash?.success && flash.success !== prev.success) {
            added.push({
                id: ++nextId,
                type: 'success',
                title: /verif/i.test(flash.success) ? 'Verified' : TITLE.success,
                message: flash.success,
            });
        }
        if (flash?.error && flash.error !== prev.error) {
            added.push({
                id: ++nextId,
                type: 'error',
                title: /reject|ditolak/i.test(flash.error) ? 'Rejected' : TITLE.error,
                message: flash.error,
            });
        }

        if (added.length > 0) {
            setToasts((prev) => [...added, ...prev]);
        }

        prevRef.current = { success: flash?.success, error: flash?.error };
    }, [flash?.success, flash?.error]);

    const remove = (id: number) =>
        setToasts((prev) => prev.filter((t) => t.id !== id));

    if (toasts.length === 0) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: '80px',
                right: '16px',
                zIndex: 200,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                alignItems: 'flex-end',
            }}
        >
            {toasts.map((item) => (
                <ToastCard key={item.id} item={item} onDone={remove} />
            ))}
        </div>
    );
}
