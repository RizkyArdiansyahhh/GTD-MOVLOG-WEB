import type { UserStatus } from '../types';

interface UserStatusBadgeProps {
    status: UserStatus;
}

export default function UserStatusBadge({ status }: UserStatusBadgeProps) {
    const isActive = status === 'Aktif';

    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap"
            style={{
                backgroundColor: isActive ? '#ecfdf5' : '#f9fafb',
                color: isActive ? '#065f46' : '#6b7280',
                border: `1px solid ${isActive ? '#a7f3d0' : '#e5e7eb'}`,
            }}
        >
            {/* Dot indicator */}
            <span
                className="inline-block rounded-full"
                style={{
                    width: 6,
                    height: 6,
                    backgroundColor: isActive ? '#10b981' : '#9ca3af',
                }}
            />
            {status}
        </span>
    );
}
