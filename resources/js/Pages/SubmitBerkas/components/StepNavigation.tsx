import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface StepNavigationProps {
  onBack: () => void;
  onSaveContinue: () => void;
  isSaving?: boolean;
  saveLabel?: string;
  backLabel?: string;
  hideBack?: boolean;
}

export function StepNavigation({
  onBack,
  onSaveContinue,
  isSaving = false,
  saveLabel = 'Simpan & Lanjut',
  backLabel = 'Kembali',
  hideBack = false,
}: StepNavigationProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#fff',
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        padding: '16px 20px',
      }}
    >
      {!hideBack ? (
        <button
          type="button"
          onClick={onBack}
          disabled={isSaving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 20px',
            borderRadius: 8,
            border: '1px solid #E2E8F0',
            background: '#fff',
            color: '#374151',
            fontSize: 13,
            fontWeight: 500,
            cursor: isSaving ? 'not-allowed' : 'pointer',
            opacity: isSaving ? 0.6 : 1,
          }}
        >
          <ArrowLeft size={15} />
          {backLabel}
        </button>
      ) : (
        <span />
      )}

      <button
        type="button"
        onClick={onSaveContinue}
        disabled={isSaving}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '10px 24px',
          borderRadius: 8,
          border: 'none',
          background: '#06283A',
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
          cursor: isSaving ? 'not-allowed' : 'pointer',
          opacity: isSaving ? 0.75 : 1,
        }}
      >
        {isSaving ? 'Menyimpan...' : saveLabel}
        {!isSaving && <ArrowRight size={15} />}
      </button>
    </div>
  );
}