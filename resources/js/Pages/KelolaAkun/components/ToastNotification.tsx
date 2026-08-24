import { useEffect } from 'react';
import { CircleCheck, CircleX, X } from 'lucide-react';

export interface ToastMessage {
    id: string;
    type: 'success' | 'error';
    message: string;
}

interface ToastNotificationProps {
    toast: ToastMessage | null;
    onClose: () => void;
}

export default function ToastNotification({ toast, onClose }: ToastNotificationProps) {
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => {
            onClose();
        }, 4000);
        return () => clearTimeout(timer);
    }, [toast, onClose]);

    if (!toast) return null;

    const isSuccess = toast.type === 'success';

    return (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 rounded-2xl p-4 shadow-xl border transition-all duration-200 animate-in slide-in-from-top-4"
            style={{
                backgroundColor: isSuccess ? '#ecfdf5' : '#fef2f2',
                borderColor: isSuccess ? '#a7f3d0' : '#fecaca',
                maxWidth: 400,
            }}
        >
            <div className="shrink-0">
                {isSuccess ? (
                    <CircleCheck size={20} className="text-emerald-600" />
                ) : (
                    <CircleX size={20} className="text-red-600" />
                )}
            </div>

            <p
                className="flex-1 text-sm font-semibold"
                style={{ color: isSuccess ? '#065f46' : '#991b1b' }}
            >
                {toast.message}
            </p>

            <button
                type="button"
                onClick={onClose}
                className="shrink-0 p-1 rounded-lg hover:bg-black/5 text-gray-500 transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    );
}
