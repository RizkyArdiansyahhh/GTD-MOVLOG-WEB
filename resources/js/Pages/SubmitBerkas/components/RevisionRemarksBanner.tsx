import React from 'react';
import { AlertCircle } from 'lucide-react';

interface RevisionRemarksBannerProps {
    remarks?: string | null;
    stepName?: string;
}

export function RevisionRemarksBanner({ remarks, stepName }: RevisionRemarksBannerProps) {
    if (!remarks) return null;

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '14px 18px',
                background: '#FFFBEB',
                border: '1px solid #FCD34D',
                borderRadius: 12,
                boxShadow: '0 1px 3px rgba(217, 119, 6, 0.08)',
            }}
        >
            <AlertCircle size={20} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>
                    Catatan Revisi dari Verifikator {stepName ? `(${stepName})` : ''}:
                </div>
                <div style={{ fontSize: 13, color: '#78350F', marginTop: 3, lineHeight: 1.5 }}>
                    {remarks}
                </div>
            </div>
        </div>
    );
}
