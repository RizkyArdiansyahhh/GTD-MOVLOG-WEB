import React from 'react';
import { Check } from 'lucide-react';
import { STEP_DEFINITIONS } from '../constants/steps';
import { useWizard } from '../hooks/useWizard';

const GOLD = '#B7791F';

const FORM_STEP_KEYS = [
  'billOfLading',
  'commercialInvoice',
  'packingList',
  'certificateOfOrigin',
  'insurance',
] as const;

export function Stepper() {
  const { currentStepIndex, stepStatuses, wizardData, goToStep, isStepUnlocked } = useWizard();

  return (
    <div className="flex items-center w-full overflow-x-auto pb-2 pt-1">
      {STEP_DEFINITIONS.map((step, index) => {
        const status = stepStatuses[index];
        const unlocked = isStepUnlocked(index);
        const isLast = index === STEP_DEFINITIONS.length - 1;

        const stepKey = FORM_STEP_KEYS[index];
        const stepRecord = stepKey ? wizardData[stepKey] : null;
        const hasRevision = !!(stepRecord?.remarks || stepRecord?.status === 'REJECTED');

        let circleStyle: React.CSSProperties = {
          background: '#fff',
          color: '#94A3B8',
          border: '1px solid #E2E8F0',
        };

        if (status === 'active') {
          circleStyle = {
            background: hasRevision ? '#D97706' : GOLD,
            color: '#fff',
            border: `1px solid ${hasRevision ? '#D97706' : GOLD}`,
          };
        } else if (hasRevision) {
          circleStyle = {
            background: '#FFFBEB',
            color: '#D97706',
            border: '1.5px solid #F59E0B',
          };
        } else if (status === 'completed') {
          circleStyle = {
            background: GOLD,
            color: '#fff',
            border: `1px solid ${GOLD}`,
          };
        }

        return (
          <React.Fragment key={step.key}>
            <button
              type="button"
              onClick={() => goToStep(index)}
              disabled={!unlocked}
              className="flex flex-col items-center gap-1.5 shrink-0 relative group"
              style={{ cursor: unlocked ? 'pointer' : 'not-allowed', minWidth: 92 }}
            >
              <div className="relative">
                <span
                  className="flex items-center justify-center rounded-full font-semibold transition-all"
                  style={{ width: 32, height: 32, fontSize: 13, ...circleStyle }}
                >
                  {status === 'completed' && !hasRevision ? (
                    <Check size={16} strokeWidth={3} />
                  ) : (
                    index + 1
                  )}
                </span>

                {/* Clean amber dot indicator if step needs revision */}
                {hasRevision && (
                  <span
                    className="absolute -top-0.5 -right-0.5 rounded-full"
                    style={{
                      width: 8,
                      height: 8,
                      background: '#D97706',
                      border: '1.5px solid #FFFFFF',
                    }}
                  />
                )}
              </div>

              <div className="flex flex-col items-center">
                <span
                  className="text-center"
                  style={{
                    fontSize: 11,
                    fontWeight: status === 'active' ? 600 : 500,
                    color: status === 'upcoming' ? '#94A3B8' : '#06283A',
                    lineHeight: 1.3,
                    maxWidth: 88,
                  }}
                >
                  {step.label}
                </span>

                {hasRevision && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: '#B45309',
                      marginTop: 1,
                    }}
                  >
                    Revisi
                  </span>
                )}
              </div>
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
