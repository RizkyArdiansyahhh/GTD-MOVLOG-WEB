import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from 'recharts';

export interface ShipmentTrendItem {
    month: string;
    year?: number;
    total: number;
}

interface ShipmentTrendChartProps {
    data?: ShipmentTrendItem[];
    /** Overrides the header badge, e.g. "12 total sessions · 2026". */
    badgeText?: string;
    /** Unit shown after the average, e.g. "shipments/day". */
    avgUnit?: string;
    /** Overrides the footer right note, e.g. "2026 · monthly". */
    footerNote?: string;
}

export default function ShipmentTrendChart({ data = [], badgeText, avgUnit = 'shipments/month', footerNote = 'Last 6 months' }: ShipmentTrendChartProps) {
    const hasData = data.length > 0;
    const totalShipments = data.reduce((acc, item) => acc + (item.total || 0), 0);
    const avgPerMonth = data.length > 0 ? (totalShipments / data.length).toFixed(1) : '0';

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-sm font-semibold text-[#06283A]">
                        Shipment Volume Trend
                    </h2>
                    <span className="text-xs text-slate-500 font-medium bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                        {badgeText ?? `${totalShipments} total sessions (6 mo)`}
                    </span>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                    Monthly logistics shipment volume
                </p>
            </div>

            {!hasData ? (
                <div className="h-[220px] flex items-center justify-center text-xs text-slate-400">
                    No shipment history yet
                </div>
            ) : (
                <div className="w-full h-[220px]">
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart
                            data={data}
                            margin={{ top: 12, right: 12, left: -20, bottom: 0 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#f1f5f9"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="month"
                                tick={{ fontSize: 12, fill: '#64748b' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 12, fill: '#64748b' }}
                                axisLine={false}
                                tickLine={false}
                                allowDecimals={false}
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
                                    `${value ?? 0} shipments`,
                                    'Volume',
                                ]}
                            />
                            <Bar
                                dataKey="total"
                                fill="#F6C343"
                                radius={[6, 6, 0, 0]}
                                barSize={28}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Rata-rata: {avgPerMonth} {avgUnit}</span>
                <span>{footerNote}</span>
            </div>
        </div>
    );
}
