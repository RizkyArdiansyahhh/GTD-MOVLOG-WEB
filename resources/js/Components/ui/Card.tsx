import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * Standard content card used across all pages:
 * white surface, 12px radius, hairline border, subtle shadow.
 */
export const Card: React.FC<CardProps> = ({ children, className = '', style }) => {
    return (
        <div className={`bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6 ${className}`} style={style}>
            {children}
        </div>
    );
};
