import React from 'react';
import { CornerDownRight } from 'lucide-react';

export function RecommendedFieldHint({ sourceLabel }: { sourceLabel: string }) {
  return (
    <p
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        color: '#B7791F',
        marginTop: 4,
        marginBottom: 0,
      }}
    >
      <CornerDownRight size={11} />
      Direkomendasikan dari {sourceLabel}
    </p>
  );
}