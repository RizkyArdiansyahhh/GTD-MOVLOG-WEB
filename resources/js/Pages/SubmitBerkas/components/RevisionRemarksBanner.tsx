import React from 'react';
import { AlertCircle } from 'lucide-react';

interface RevisionRemarksBannerProps {
    remarks?: string | null;
    stepName?: string;
}

export function RevisionRemarksBanner({ remarks }: RevisionRemarksBannerProps) {
    if (!remarks) return null;

    return (
        <div
            style={{
                display: 'inline-flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '7px 12px',
                background: '#FEF3C7',
                border: '1px solid #FCD34D',
                borderRadius: 8,
                fontSize: 12,
                lineHeight: 1.4,
                width: 'fit-content',
                maxWidth: 680,
                boxSizing: 'border-box',
            }}
        >
            <AlertCircle size={14} color="#B45309" style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, color: '#78350F', fontSize: 12 }}>
                    Catatan Revisi:
                </span>
                <span style={{ color: '#92400E', fontSize: 12, fontWeight: 500 }}>
                    {remarks}
                </span>
            </div>
        </div>
    );
}
