import React from 'react';

interface WizardHeaderProps {
  /** Nama perusahaan customer yang sedang aktif untuk sesi submit ini (opsional). */
  customerName?: string;
}

export function WizardHeader({ customerName }: WizardHeaderProps) {
  return (
    <div>
      <h1
        style={{
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 600,
          fontSize: 32,
          color: '#06283A',
          margin: 0,
        }}
      >
        Submit Berkas
      </h1>
      <p style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
        Lengkapi data dan dokumen sebelum pengiriman diproses
      </p>

      {customerName && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 10,
            padding: '4px 12px',
            borderRadius: 999,
            backgroundColor: '#FFF4D6',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: '#B7791F',
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#B7791F',
            }}
          >
            {customerName}
          </span>
        </div>
      )}
    </div>
  );
}