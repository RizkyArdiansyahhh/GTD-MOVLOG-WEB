import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface StepNavigationProps {
  onBack: () => void;
  onSaveContinue: () => void;
  isSaving?: boolean;
  saveLabel?: string;
  showBack?: boolean;
  readOnly?: boolean;
}

export function StepNavigation({
  onBack,
  onSaveContinue,
  isSaving = false,
  saveLabel,
  showBack = true,
  readOnly = false,
}: StepNavigationProps) {
  const displayLabel = saveLabel ?? (readOnly ? 'Next' : 'Save & Continue');

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: showBack ? 'space-between' : 'flex-end',
        alignItems: 'center',
        paddingTop: 8,
      }}
    >
      {showBack && (
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
            fontWeight: 600,
            cursor: isSaving ? 'not-allowed' : 'pointer',
          }}
        >
          <ArrowLeft size={15} />
          Kembali
        </button>
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
        {isSaving ? 'Menyimpan...' : displayLabel}
        {!isSaving && <ArrowRight size={15} />}
      </button>
    </div>
  );
}