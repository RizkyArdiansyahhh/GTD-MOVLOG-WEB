import { useEffect } from 'react';
import { TriangleAlert, CircleCheck, Loader2 } from 'lucide-react';
import type { KelolaAkunUser } from '../types';

interface UserStatusConfirmationModalProps {
    isOpen: boolean;
    user: KelolaAkunUser | null;
    onClose: () => void;
    onConfirm: () => void;
    isSubmitting?: boolean;
}

export default function UserStatusConfirmationModal({
    isOpen,
    user,
    onClose,
    onConfirm,
    isSubmitting = false,
}: UserStatusConfirmationModalProps) {
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

    const isCurrentlyActive = user.status === 'Active';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            aria-labelledby="modal-title"
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
                        backgroundColor: isCurrentlyActive ? '#fef2f2' : '#ecfdf5',
                    }}
                >
                    {isCurrentlyActive ? (
                        <TriangleAlert size={26} className="text-red-500" strokeWidth={1.8} />
                    ) : (
                        <CircleCheck size={26} className="text-emerald-500" strokeWidth={1.8} />
                    )}
                </div>

                {/* Title */}
                <h3
                    id="modal-title"
                    className="text-lg font-bold mb-2"
                    style={{ color: '#06283A' }}
                >
                    {isCurrentlyActive ? 'Deactivate Account?' : 'Activate Account?'}
                </h3>

                {/* Message */}
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                    {isCurrentlyActive ? (
                        <>
                            Are you sure you want to deactivate the account of{' '}
                            <strong className="text-gray-900 font-semibold">{user.name}</strong>?
                            <br />
                            <span className="block mt-2 text-xs text-gray-400">
                                This user will not be able to log in until the account is reactivated.
                            </span>
                        </>
                    ) : (
                        <>
                            Are you sure you want to reactivate the account of{' '}
                            <strong className="text-gray-900 font-semibold">{user.name}</strong>?
                            <br />
                            <span className="block mt-2 text-xs text-gray-400">
                                This user will regain access to all features according to their role.
                            </span>
                        </>
                    )}
                </p>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={onClose}
                        className="rounded-xl px-4 text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all duration-150 disabled:opacity-50 cursor-pointer"
                        style={{ height: 42 }}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={onConfirm}
                        className="flex items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white shadow-md transition-all duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                        style={{
                            height: 42,
                            backgroundColor: isCurrentlyActive ? '#ef4444' : '#10b981',
                        }}
                    >
                        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                        {isCurrentlyActive ? 'Yes, Deactivate' : 'Yes, Activate'}
                    </button>
                </div>
            </div>
        </div>
    );
}
