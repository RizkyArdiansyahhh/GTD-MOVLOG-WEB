import type { LogisticsStage } from '../types';
import { Check } from 'lucide-react';

const STAGES: LogisticsStage[] = ['Kapal', 'Tongkang', 'Pelabuhan', 'Site'];

interface ProgressTimelineProps {
    currentStage: LogisticsStage;
}

export default function ProgressTimeline({ currentStage }: ProgressTimelineProps) {
    const currentIndex = STAGES.indexOf(currentStage);

    return (
        <div className="flex flex-col justify-center py-1 max-w-[280px]">
            {/* ── Timeline Nodes & Connectors ── */}
            <div className="relative flex items-center justify-between">
                {STAGES.map((stage, idx) => {
                    const isCompleted = idx < currentIndex;
                    const isCurrent = idx === currentIndex;

                    // Connector line to next node
                    const hasConnector = idx < STAGES.length - 1;
                    const connectorCompleted = idx < currentIndex;

                    return (
                        <div key={stage} className="relative flex-1 flex items-center justify-center">
                            {/* Connector Line */}
                            {hasConnector && (
                                <div
                                    className="absolute left-1/2 right-[-50%] top-1/2 -translate-y-1/2 h-[2px] transition-colors"
                                    style={{
                                        backgroundColor: connectorCompleted ? '#10B981' : '#CBD5E1',
                                        zIndex: 0,
                                    }}
                                />
                            )}

                            {/* Node Dot */}
                            <div
                                className={`relative z-10 flex items-center justify-center rounded-full transition-all duration-150 ${
                                    isCurrent ? 'ring-4 ring-amber-100' : ''
                                }`}
                                style={{
                                    width: '14px',
                                    height: '14px',
                                    backgroundColor: isCompleted
                                        ? '#10B981'
                                        : isCurrent
                                        ? '#F5B800'
                                        : '#CBD5E1',
                                }}
                                title={`${stage}: ${isCompleted ? 'Selesai' : isCurrent ? 'Berlangsung' : 'Mendatang'}`}
                            >
                                {isCompleted ? (
                                    <Check size={9} strokeWidth={3.5} className="text-white" />
                                ) : isCurrent ? (
                                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                ) : null}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Stage Labels ── */}
            <div className="flex justify-between mt-1 text-[11px]">
                {STAGES.map((stage, idx) => {
                    const isCompleted = idx < currentIndex;
                    const isCurrent = idx === currentIndex;

                    return (
                        <span
                            key={stage}
                            className="flex-1 text-center truncate px-0.5"
                            style={{
                                color: isCurrent ? '#06283A' : isCompleted ? '#10B981' : '#64748B',
                                fontWeight: isCurrent ? 700 : isCompleted ? 600 : 400,
                            }}
                        >
                            {stage}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}
