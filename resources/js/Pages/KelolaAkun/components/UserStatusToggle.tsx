import type { UserStatus } from '../types';

interface UserStatusToggleProps {
    status: UserStatus;
    onToggle: () => void;
    disabled?: boolean;
}

export default function UserStatusToggle({
    status,
    onToggle,
    disabled = false,
}: UserStatusToggleProps) {
    const isActive = status === 'Aktif';

    return (
        <button
            type="button"
            role="switch"
            aria-checked={isActive}
            disabled={disabled}
            onClick={onToggle}
            className={[
                'relative inline-flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer select-none',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2',
                disabled ? 'opacity-50 cursor-not-allowed' : '',
            ].join(' ')}
            style={{
                width: 44,
                height: 24,
                backgroundColor: isActive ? '#10b981' : '#9ca3af',
            }}
            title={`Status saat ini: ${status}. Klik untuk mengubah status.`}
        >
            <span className="sr-only">Toggle Status Akun ({status})</span>
            {/* Toggle Knob */}
            <span
                className="inline-block rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out"
                style={{
                    width: 20,
                    height: 20,
                    transform: isActive ? 'translateX(20px)' : 'translateX(0px)',
                }}
            />
        </button>
    );
}
