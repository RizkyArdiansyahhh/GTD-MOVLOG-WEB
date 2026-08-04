import React from 'react';
import type { DateRange, DateRangePreset } from '../types/laporan';
import { DATE_RANGE_PRESETS } from '../constants/laporan';

interface DateRangeCardProps {
    selectedPreset: DateRangePreset | 'custom';
    dateRange: DateRange;
    onPresetChange: (preset: DateRangePreset) => void;
    onDateChange: (field: keyof DateRange, value: string) => void;
}

export const DateRangeCard: React.FC<DateRangeCardProps> = ({
    selectedPreset,
    dateRange,
    onPresetChange,
    onDateChange,
}) => {
    return (
        <div
            style={{
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #E5E7EB',
                padding: 20,
            }}
        >
            {/* Card Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <span style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: '#FFF4D6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    {/* Calendar Icon */}
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#B7791F" strokeWidth={2}>
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                </span>
                <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 15, color: '#06283A' }}>
                    Rentang Waktu
                </span>
            </div>

            {/* Quick Filter Chips */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {DATE_RANGE_PRESETS.map((preset) => {
                    const isActive = selectedPreset === preset.key;
                    return (
                        <button
                            key={preset.key}
                            onClick={() => onPresetChange(preset.key)}
                            style={{
                                padding: '6px 14px',
                                borderRadius: 20,
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: isActive ? 600 : 400,
                                background: isActive ? '#FFF4D6' : '#F8FAFB',
                                color: isActive ? '#B7791F' : '#6B7280',
                                transition: 'all 0.15s',
                            }}
                        >
                            {preset.label}
                        </button>
                    );
                })}
            </div>

            {/* Date Pickers */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                    <label style={{ display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 6, fontWeight: 500 }}>
                        Dari Tanggal
                    </label>
                    <input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => onDateChange('from', e.target.value)}
                        style={{
                            width: '100%',
                            height: 40,
                            border: '1px solid #E2E8F0',
                            borderRadius: 8,
                            padding: '0 12px',
                            fontSize: 13,
                            color: '#06283A',
                            outline: 'none',
                            boxSizing: 'border-box',
                            background: '#fff',
                        }}
                    />
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                    <label style={{ display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 6, fontWeight: 500 }}>
                        Sampai Tanggal
                    </label>
                    <input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => onDateChange('to', e.target.value)}
                        style={{
                            width: '100%',
                            height: 40,
                            border: '1px solid #E2E8F0',
                            borderRadius: 8,
                            padding: '0 12px',
                            fontSize: 13,
                            color: '#06283A',
                            outline: 'none',
                            boxSizing: 'border-box',
                            background: '#fff',
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
