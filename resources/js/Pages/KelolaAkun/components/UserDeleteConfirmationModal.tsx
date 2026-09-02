import { useEffect, useRef } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import type { KelolaAkunUser } from '../types';

interface UserDeleteConfirmationModalProps {
    isOpen: boolean;
    user: KelolaAkunUser | null;
    onClose: () => void;
    onConfirm: () => void;
    isSubmitting?: boolean;
}

export default function UserDeleteConfirmationModal({
    isOpen,
    user,
    onClose,
    onConfirm,
    isSubmitting = false,
}: UserDeleteConfirmationModalProps) {
    const cancelButtonRef = useRef<HTMLButtonElement>(null);

    // Auto focus on "Batal" button when modal appears
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                cancelButtonRef.current?.focus();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !isSubmitting) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isSubmitting, onClose]);

    if (!isOpen || !user) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            aria-labelledby="delete-modal-title"
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
                onClick={() => {
                    if (!isSubmitting) onClose();
                }}
            />

            {/* Modal Card */}
            <div
                className="relative bg-white rounded-2xl border border-gray-100 shadow-2xl p-6 max-w-md w-full z-10 transform transition-all duration-200"
                style={{ fontFamily: "'Poppins', sans-serif" }}
            >
                {/* Icon Container */}
                <div
                    className="flex items-center justify-center rounded-2xl mb-4"
                    style={{
                        width: 52,
                        height: 52,
                        backgroundColor: '#fef2f2',
                    }}
                >
                    <Trash2 size={26} className="text-red-600" strokeWidth={1.8} />
                </div>

                {/* Title */}
                <h3
                    id="delete-modal-title"
                    className="text-lg font-bold mb-2"
                    style={{ color: '#06283A' }}
                >
                    Delete User
                </h3>

                {/* Message */}
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Are you sure you want to delete the following user?
                </p>

                {/* User Info Details */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100 text-sm space-y-2">
                    <div className="flex justify-between items-center gap-2">
                        <span className="text-gray-500 font-medium shrink-0">Name:</span>
                        <span className="font-semibold text-gray-900 truncate">{user.name}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                        <span className="text-gray-500 font-medium shrink-0">Email:</span>
                        <span className="font-semibold text-gray-900 truncate">{user.email}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                        <span className="text-gray-500 font-medium shrink-0">Role:</span>
                        <span className="font-semibold text-gray-900">{user.role}</span>
                    </div>
                </div>

                {/* Warning text */}
                <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium mb-6">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>This action cannot be undone.</span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3">
                    <button
                        ref={cancelButtonRef}
                        type="button"
                        disabled={isSubmitting}
                        onClick={onClose}
                        className="rounded-xl px-4 text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-100 transition-all duration-150 disabled:opacity-50 cursor-pointer"
                        style={{ height: 42 }}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={onConfirm}
                        className="flex items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white shadow-md transition-all duration-150 hover:bg-red-700 active:scale-[0.98] disabled:opacity-50 cursor-pointer min-w-[90px]"
                        style={{
                            height: 42,
                            backgroundColor: '#dc2626',
                        }}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Deleting...</span>
                            </>
                        ) : (
                            'Delete'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
