import React from 'react';

export function WizardHeader() {
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
    </div>
  );
}