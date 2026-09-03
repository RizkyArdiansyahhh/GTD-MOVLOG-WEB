import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export interface ChangedDataModalProps {
  sections: string[];
  sourceLabel?: string;
  onClose: () => void;
  onConfirm?: () => void;
}

export function ChangedDataModal({
  sections,
  sourceLabel = 'Bill of Lading',
  onClose,
  onConfirm,
}: ChangedDataModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #E5E7EB',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
          width: '100%',
          maxWidth: 420,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '20px 20px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              background: '#FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertCircle size={20} color="#DC2626" />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 600,
                color: '#111827',
                lineHeight: 1.3,
              }}
            >
              Data Changes Detected
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#6B7280', lineHeight: 1.4 }}>
              Data differs from {sourceLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              color: '#9CA3AF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '0 20px 20px' }}>
          <p
            style={{
              margin: '0 0 12px',
              fontSize: 13,
              color: '#4B5563',
              lineHeight: 1.5,
            }}
          >
            Perubahan terdeteksi di bagian berikut. Pastikan perbedaan ini disengaja agar tidak terjadi selisih data.
          </p>

          <ul
            style={{
              listStyle: 'none',
              margin: '0 0 20px',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {sections.map((section) => (
              <li
                key={section}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  background: '#FEF2F2',
                  border: '1px solid #FEE2E2',
                  borderRadius: 6,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#DC2626',
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 12.5, fontWeight: 500, color: '#991B1B' }}>
                  {section}
                </span>
              </li>
            ))}
          </ul>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #D1D5DB',
                background: '#FFFFFF',
                color: '#374151',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Perbaiki Data
            </button>
            {onConfirm && (
              <button
                type="button"
                onClick={onConfirm}
                style={{
                  flex: 1.2,
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #DC2626',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Save Anyway & Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}