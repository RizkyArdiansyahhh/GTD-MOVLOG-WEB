import type { HTMLAttributes } from 'react';

export type BadgeTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    tone?: BadgeTone;
    dot?: boolean;
}

export function Badge({ tone = 'neutral', dot = true, className = '', children, ...props }: BadgeProps) {
    return (
        <span {...props} className={`soft-badge ${className}`} data-tone={tone}>
            {dot && <span className="soft-badge-dot" aria-hidden="true" />}
            {children}
        </span>
    );
}
