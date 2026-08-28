import React from 'react';
import { Check } from 'lucide-react';
import { STEP_DEFINITIONS } from '../constants/steps';
import { useWizard } from '../hooks/useWizard';

const GOLD = '#B7791F';
const GOLD_LIGHT = '#FFF4D6';

export function Stepper() {
  const { currentStepIndex, stepStatuses, goToStep, isStepUnlocked } = useWizard();

  return (
    <div className="flex items-center w-full overflow-x-auto pb-1">
      {STEP_DEFINITIONS.map((step, index) => {
        const status = stepStatuses[index];
        const unlocked = isStepUnlocked(index);
        const isLast = index === STEP_DEFINITIONS.length - 1;

        const circleStyle: React.CSSProperties =
          status === 'completed'
            ? { background: GOLD, color: '#fff', border: `1px solid ${GOLD}` }
            : status === 'active'
              ? { background: GOLD, color: '#fff', border: `1px solid ${GOLD}` }
              : { background: '#fff', color: '#94A3B8', border: '1px solid #E2E8F0' };

        return (
          <React.Fragment key={step.key}>
            <button
              type="button"
              onClick={() => goToStep(index)}
              disabled={!unlocked}
              className="flex flex-col items-center gap-2 shrink-0"
              style={{ cursor: unlocked ? 'pointer' : 'not-allowed', minWidth: 92 }}
            >
              <span
                className="flex items-center justify-center rounded-full font-semibold"
                style={{ width: 32, height: 32, fontSize: 13, ...circleStyle }}
              >
                {status === 'completed' ? <Check size={16} strokeWidth={3} /> : index + 1}
              </span>
              <span
                className="text-center"
                style={{
                  fontSize: 11,
                  fontWeight: status === 'active' ? 600 : 500,
                  color: status === 'upcoming' ? '#94A3B8' : '#06283A',
                  lineHeight: 1.3,
                  maxWidth: 90,
                }}
              >
                {step.label}
              </span>
            </button>

            {!isLast && (
              <div
                className="flex-1 shrink-0"
                style={{
                  height: 2,
                  minWidth: 24,
                  marginBottom: 20,
                  background: status === 'completed' ? GOLD : '#E2E8F0',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}