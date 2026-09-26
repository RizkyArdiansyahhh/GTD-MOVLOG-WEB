import { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { PageHeader } from '@/Components/ui';
import CheckpointPipelineChart from './components/CheckpointPipelineChart';
import ShipmentTrendChart from './components/ShipmentTrendChart';
import type { PageProps } from '@/types';
import {
    CheckCircle2,
    ClipboardCheck,
    FileCheck2,
    Package,
    Truck,
} from 'lucide-react';

/* ── Backend prop shapes (DashboardController) ─────────────────── */
interface OperationalKpis {
    active_shipments: number;
    pending_documents: number;
    pending_assignments: number;
    active_movements: number;
    total_quantity: number;
    quantity_unit: string | null;
    delivered_count: number;
    total_count: number;
    delivery_rate: number;
}

interface PipelineStage {
    id: number;
    name: string;
    sequence: number;
    count: number;
}

interface OperationalShipment {
    id: string;
    assignment_no: string;
    cargo_name: string;
    total_quantity: number | null;
    unit: string;
    units_total: number;
    customer_name: string | null;
    origin: string | null;
    destination: string | null;
    status: string;
    current_checkpoint_id: number | null;
    current_checkpoint: string | null;
    progress_pct: number;
    finished_stages: number;
    total_stages: number;
    active_movements: string[];
    updated_at: string | null;
}

interface FeedItem {
    kind: string;
    title: string;
    actor: string | null;
    at: string | null;
    ref: string | null;
    status: string | null;
}

interface TrendMeta {
    mode: string;
    year: number;
    month: number | null;
    years: number[];
    filtered?: boolean;
}

interface DashboardProps extends PageProps {
    stats?: { total_users?: number; total_shipments?: number; in_transit_shipments?: number; pending_shipments?: number };
    recentSessions?: unknown[];
    masterCheckpoints?: { id: number; name: string; sequence: number }[];
    shipment_trends?: { month: string; year?: number; total: number }[];
    trend_meta?: TrendMeta;
    checkpoint_pipeline?: { name: string; count: number }[];
    operational_kpis?: OperationalKpis;
    operational_pipeline?: PipelineStage[];
    operational_shipments?: OperationalShipment[];
    operational_feed?: FeedItem[];
    operational_alerts?: { pending_documents: number; pending_assignments: number; unassigned_sessions: unknown[]; unassigned_count: number };
}

/* ── Small helpers ─────────────────────────────────────────────── */
function timeAgo(iso: string | null): string {
    if (!iso) return '-';
    const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} min ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TREND_MODES = [
    { value: 'harian', label: 'Daily' },
    { value: 'bulanan', label: 'Monthly' },
    { value: 'tahunan', label: 'Yearly' },
] as const;

export default function Index(props: DashboardProps) {
    const kpis = props.operational_kpis;
    const feed = props.operational_feed ?? [];

    const now = new Date();
    const meta: TrendMeta = props.trend_meta ?? { mode: 'bulanan', year: now.getFullYear(), month: null, years: [now.getFullYear()] };
    const [trendMode, setTrendMode] = useState(meta.mode);
    const [trendYear, setTrendYear] = useState(meta.year);
    const [trendMonth, setTrendMonth] = useState(meta.month ?? now.getMonth() + 1);

    useEffect(() => {
        setTrendMode(meta.mode);
        setTrendYear(meta.year);
        if (meta.month !== null && meta.month !== undefined) setTrendMonth(meta.month);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.trend_meta]);

    function pushTrend(mode: string, year: number, month: number) {
        const params: Record<string, number | string> = { trend_mode: mode, trend_year: year };
        if (mode === 'harian') params.trend_month = month;
        router.get('/', params, { preserveScroll: true, preserveState: true, only: ['shipment_trends', 'trend_meta', 'operational_kpis', 'checkpoint_pipeline', 'operational_pipeline'] });
    }

    const isFiltered = meta.filtered === true;
    const scopeLabel =
        !isFiltered
            ? 'All-time'
            : meta.mode === 'harian' && meta.month
                ? `${MONTH_NAMES[meta.month - 1]} ${meta.year}`
                : meta.mode === 'tahunan'
                    ? 'all years'
                    : `${meta.year}`;

    const kpiCards = [
        {
            label: 'Active Shipments',
            value: (kpis?.active_shipments ?? 0).toLocaleString('en-US'),
            sub: `sessions in transit · ${scopeLabel}`,
            icon: Truck,
            tile: 'bg-blue-50 text-blue-600',
        },
        {
            label: 'Document Verification Queue',
            value: (kpis?.pending_assignments ?? 0).toLocaleString('en-US'),
            sub: `${kpis?.pending_documents ?? 0} pending documents · ${scopeLabel}`,
            icon: FileCheck2,
            tile: 'bg-amber-50 text-amber-600',
        },
        {
            label: 'Total Cargo Managed',
            value: (kpis?.total_quantity ?? 0).toLocaleString('en-US'),
            sub: kpis?.quantity_unit ? `primary unit: ${kpis.quantity_unit} · ${scopeLabel}` : `all sessions · ${scopeLabel}`,
            icon: Package,
            tile: 'bg-purple-50 text-purple-600',
        },
        {
            label: 'Delivery Rate',
            value: `${kpis?.delivery_rate ?? 0}%`,
            sub: `${kpis?.delivered_count ?? 0} of ${kpis?.total_count ?? 0} sessions · ${scopeLabel}`,
            icon: CheckCircle2,
            tile: 'bg-emerald-50 text-emerald-600',
        },
    ];

    const trends = props.shipment_trends ?? [];
    const trendTotal = trends.reduce((acc, t) => acc + (t.total || 0), 0);
    const trendBadge =
        meta.mode === 'harian' && meta.month
            ? `${trendTotal} sessions · ${MONTH_NAMES[meta.month - 1]} ${meta.year}`
            : meta.mode === 'tahunan'
                ? `${trendTotal} sessions · all years`
                : `${trendTotal} sessions · ${meta.year}`;
    const trendAvgUnit = meta.mode === 'harian' ? 'shipments/day' : meta.mode === 'tahunan' ? 'shipments/year' : 'shipments/month';
    const trendFooter =
        meta.mode === 'harian' && meta.month
            ? `${MONTH_NAMES[meta.month - 1]} ${meta.year} · daily`
            : meta.mode === 'tahunan'
                ? 'Per year · all periods'
                : `${meta.year} · monthly`;

    const selectClass =
        'text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-[#F6C343] focus:border-transparent cursor-pointer';

    return (
        <DashboardLayout title="Dashboard">
            <Head title="Dashboard" />

            <div className="space-y-6">
                <PageHeader
                    title="Dashboard"
                    subtitle="Monitor operational performance, shipment trends, and live field activity."
                />

                {/* ── Operational Command Deck ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {kpiCards.map((card) => {
                        const Icon = card.icon;
                        return (
                            <div key={card.label} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between min-h-[118px]">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-medium text-slate-500 leading-tight">{card.label}</span>
                                    <div className={`w-9 h-9 rounded-xl ${card.tile} flex items-center justify-center shrink-0`}>
                                        <Icon size={18} strokeWidth={2} />
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <span className="text-2xl font-bold text-[#06283A]">{card.value}</span>
                                    <p className="text-[11px] text-slate-400 mt-0.5">{card.sub}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Volume trend + period filter ── */}
                <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2.5">
                        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
                            {TREND_MODES.map((m) => (
                                <button
                                    key={m.value}
                                    type="button"
                                    onClick={() => pushTrend(m.value, trendYear, trendMonth)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${trendMode === m.value ? 'bg-[#06283A] text-white shadow-sm' : 'text-slate-500 hover:text-[#06283A]'
                                        }`}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                        {trendMode !== 'tahunan' && (
                            <select
                                value={trendYear}
                                onChange={(e) => pushTrend(trendMode, Number(e.target.value), trendMonth)}
                                className={selectClass}
                                aria-label="Select year"
                            >
                                {meta.years.map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                        )}
                        {trendMode === 'harian' && (
                            <select
                                value={trendMonth}
                                onChange={(e) => pushTrend(trendMode, trendYear, Number(e.target.value))}
                                className={selectClass}
                                aria-label="Select month"
                            >
                                {MONTH_NAMES.map((name, i) => (
                                    <option key={name} value={i + 1}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                    <ShipmentTrendChart data={trends} badgeText={trendBadge} avgUnit={trendAvgUnit} footerNote={trendFooter} />
                </div>

                {/* ── Pipeline + feed pendek ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <CheckpointPipelineChart data={props.checkpoint_pipeline ?? []} scopeLabel={scopeLabel} isFiltered={isFiltered} />
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        <h2 className="text-sm font-bold text-[#06283A]">Live Activity Feed</h2>
                        <p className="text-xs text-slate-500 mt-0.5 mb-2">Field reports, verifications & completed stages</p>
                        {feed.length === 0 ? (
                            <p className="text-xs text-slate-400 bg-slate-50/60 border border-dashed border-slate-200 rounded-xl p-4 text-center">
                                No operational activity recorded yet.
                            </p>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {feed.slice(0, 5).map((item, i) => (
                                    <li key={`${item.kind}-${item.at}-${i}`} className="py-2 flex items-start gap-3">
                                        <span
                                            className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.kind === 'verification'
                                                ? 'bg-emerald-50 text-emerald-600'
                                                : item.kind === 'stage'
                                                    ? 'bg-blue-50 text-blue-600'
                                                    : 'bg-amber-50 text-amber-600'
                                                }`}
                                        >
                                            {item.kind === 'verification' ? (
                                                <ClipboardCheck size={14} />
                                            ) : item.kind === 'stage' ? (
                                                <CheckCircle2 size={14} />
                                            ) : (
                                                <FileCheck2 size={14} />
                                            )}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold text-slate-700 leading-snug">{item.title}</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                {item.actor ?? 'System'}
                                                {item.ref ? <> · <span className="font-mono font-medium">{item.ref}</span></> : null}
                                                <> · {timeAgo(item.at)}</>
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
