import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface WizardHeaderProps {
  customerName?: string;
  onCancelWizard?: () => void;
}

export function WizardHeader({ customerName, onCancelWizard }: WizardHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
      <div>
        <h1
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
            fontSize: 28,
            color: '#06283A',
            margin: 0,
          }}
        >
          Submit Documents
        </h1>
        <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
          Complete information and documents before shipment is processed
        </p>

        {customerName && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 8,
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

      {onCancelWizard && (
        <button
          type="button"
          onClick={onCancelWizard}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid #E2E8F0',
            background: '#FFFFFF',
            color: '#475569',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <ArrowLeft size={15} />
          Back to Documents Dashboard
        </button>
      )}
    </div>
  );
}
