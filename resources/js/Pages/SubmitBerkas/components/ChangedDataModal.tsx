import React from 'react';
import { AlertCircle, AlertTriangle, X } from 'lucide-react';

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
        background: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(3px)',
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          width: '100%',
          maxWidth: 440,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
            borderBottom: '1px solid #FCD34D',
            padding: '20px 24px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={22} color="#fff" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#92400E' }}>
                Ada Data yang Berubah!
              </p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#B45309' }}>
                Data berikut berbeda dari {sourceLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              color: '#92400E',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
            Perubahan terdeteksi di section berikut. Pastikan perubahan ini{' '}
            <strong>disengaja</strong> agar tidak terjadi perbedaan data antara
            dokumen ini dan {sourceLabel}.
          </p>

          <ul
            style={{
              listStyle: 'none',
              margin: '0 0 20px',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {sections.map((section) => (
              <li
                key={section}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 14px',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 8,
                }}
              >
                <AlertCircle size={14} color="#DC2626" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#DC2626' }}>
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
                padding: '11px 0',
                borderRadius: 10,
                border: '1px solid #D1D5DB',
                background: '#fff',
                color: '#374151',
                fontSize: 13.5,
                fontWeight: 600,
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
                  padding: '11px 0',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                  color: '#fff',
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(220,38,38,0.3)',
                }}
              >
                Tetap Simpan & Lanjut
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}