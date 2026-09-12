import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export interface CheckpointPipelineItem {
    name: string;
    count: number;
}

interface CheckpointPipelineChartProps {
    data?: CheckpointPipelineItem[];
}

export default function CheckpointPipelineChart({ data = [] }: CheckpointPipelineChartProps) {
    const hasData = data.length > 0;
    const totalActive = data.reduce((acc, item) => acc + item.count, 0);

    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-sm font-semibold text-[#06283A]">Sebaran Pengiriman per Checkpoint</h2>
                    <span className="text-xs text-slate-500 font-medium">
                        {totalActive} sesi aktif
                    </span>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                    Jumlah sesi yang sedang aktif di tiap tahap saat ini
                </p>
            </div>

            {!hasData ? (
                <div className="h-[220px] flex items-center justify-center text-xs text-slate-400">
                    Belum ada data checkpoint
                </div>
            ) : (
                <div className="w-full h-[220px]">
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                        >
                            <XAxis type="number" hide allowDecimals={false} />
                            <YAxis
                                type="category"
                                dataKey="name"
                                width={85}
                                tick={{ fontSize: 12, fill: '#64748b' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '12px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                    color: '#06283A',
                                }}
                                formatter={(value: any) => [
                                    `${value ?? 0} sesi aktif`,
                                    'Jumlah',
                                ]}
                            />
                            <Bar
                                dataKey="count"
                                fill="#F6C343"
                                radius={[0, 4, 4, 0]}
                                barSize={20}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
