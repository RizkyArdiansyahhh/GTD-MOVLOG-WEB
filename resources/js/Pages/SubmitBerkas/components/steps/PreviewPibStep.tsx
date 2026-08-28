import React, { useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Users,
    Ship,
    FileText,
    Calculator,
    Package,
    CheckCircle2,
    AlertTriangle,
    ChevronLeft,
    X,
} from 'lucide-react';
import { useWizard } from '../../hooks/useWizard';

const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 12,
    border: '1px solid #E5E7EB',
    overflow: 'hidden',
};

const cardHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 20px',
    borderBottom: '1px solid #F1F5F9',
    background: '#FAFBFC',
};

const cardTitleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: 14,
    fontWeight: 700,
    color: '#06283A',
};

const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    padding: '10px 20px',
    borderBottom: '1px solid #F8FAFC',
    fontSize: 13,
};

const rowLabelStyle: React.CSSProperties = {
    color: '#6B7280',
    flexShrink: 0,
};

const rowValueStyle: React.CSSProperties = {
    color: '#06283A',
    fontWeight: 600,
    textAlign: 'right',
};

interface Row {
    label: string;
    value: string;
}

function SummaryCard({
    icon,
    title,
    rows,
}: {
    icon: React.ReactNode;
    title: string;
    rows: Row[];
}) {
    return (
        <div style={cardStyle}>
            <div style={cardHeaderStyle}>
                {icon}
                <p style={cardTitleStyle}>{title}</p>
            </div>
            {rows.map((row, i) => (
                <div
                    key={i}
                    style={{ ...rowStyle, borderBottom: i === rows.length - 1 ? 'none' : rowStyle.borderBottom }}
                >
                    <span style={rowLabelStyle}>{row.label}</span>
                    <span style={rowValueStyle}>{row.value || '—'}</span>
                </div>
            ))}
        </div>
    );
}

interface MergedCargoItem {
    descriptionOfGoods: string;
    type: string;
    brand: string;
    netWeight: string;
    quantityOfGoods: string;
    goodsUnitMeasurement: string;
    quantityOfPackage: string;
    packageUnitMeasurement: string;
    price: string;
}

interface ConfirmSubmitModalProps {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    isSubmitting: boolean;
    warnings?: string[];
}

function ConfirmSubmitModal({ open, onConfirm, onCancel, isSubmitting, warnings = [] }: ConfirmSubmitModalProps) {
    if (!open) return null;
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
        }}>
            <div style={{
                background: '#fff',
                borderRadius: 16,
                width: 420,
                maxWidth: '90vw',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                overflow: 'hidden',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '18px 22px',
                    borderBottom: '1px solid #F1F5F9',
                }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#06283A' }}>
                        Konfirmasi Submit Berkas
                    </h3>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: '18px 22px' }}>
                    <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
                        Apakah Anda yakin ingin mengirimkan seluruh berkas penugasan ini untuk diverifikasi?
                        Status dokumen akan berubah dari <strong>Draft</strong> menjadi <strong>Pending Verifikasi</strong>.
                    </p>

                    {warnings.length > 0 && (
                        <div style={{
                            marginTop: 14,
                            padding: '10px 14px',
                            background: '#FFFBEB',
                            border: '1px solid #FDE68A',
                            borderRadius: 8,
                        }}>
                            <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: '#92400E' }}>
                                Perhatian:
                            </p>
                            <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 12, color: '#78350F' }}>
                                {warnings.map((w, i) => (
                                    <li key={i} style={{ marginBottom: 2 }}>
                                        {w}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: 10, padding: 22 }}>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        style={{
                            flex: 1,
                            padding: '10px 16px',
                            borderRadius: 10,
                            border: '1px solid #E2E8F0',
                            background: '#fff',
                            color: '#374151',
                            fontSize: 13.5,
                            fontWeight: 600,
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        }}
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        style={{
                            flex: 1,
                            padding: '10px 16px',
                            borderRadius: 10,
                            border: 'none',
                            background: 'linear-gradient(135deg, #06283A, #0A3D5C)',
                            color: '#fff',
                            fontSize: 13.5,
                            fontWeight: 700,
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            opacity: isSubmitting ? 0.7 : 1,
                        }}
                    >
                        {isSubmitting ? 'Mengirim...' : 'Ya, Submit'}
                    </button>
                </div>
            </div>
        </div>
    );
}

interface PreviewPibStepProps {
    onFinished?: () => void;
}

export function PreviewPibStep({ onFinished }: PreviewPibStepProps) {
    const { wizardData, goBack, goToStep, assignmentNoRef } = useWizard();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);

    const bol = wizardData.billOfLading;
    const ci = wizardData.commercialInvoice;
    const pl = wizardData.packingList;
    const coo = wizardData.certificateOfOrigin;
    const insurance = wizardData.insurance;

    // --- Completeness check -------------------------------------------------
    const isBolComplete = !!(bol?.data && bol.data.documentDetail?.number && bol.data.documentDetail?.date);
    const isCiComplete = !!(ci?.data && ci.data.documentDetail?.number && ci.data.cargoDetail?.length);
    const isPlComplete = !!(pl?.data && pl.data.documentDetail?.number && pl.data.cargoDetail?.length);
    const isCooComplete = !!(coo?.data && coo.data.documentDetail?.number && coo.data.documentDetail?.date);
    const isInsuranceComplete = !!insurance?.data;

    const allComplete =
        isBolComplete && isCiComplete && isPlComplete && isCooComplete && isInsuranceComplete && !!assignmentNoRef;

    const incompleteSteps = [
        { label: 'Bill of Lading', index: 0, done: isBolComplete },
        { label: 'Commercial Invoice', index: 1, done: isCiComplete },
        { label: 'Packing List', index: 2, done: isPlComplete },
        { label: 'Certificate of Origin', index: 3, done: isCooComplete },
        { label: 'Insurance', index: 4, done: isInsuranceComplete },
    ].filter((s) => !s.done);

    const shipper = bol?.data?.shipper ?? ci?.data?.shipper ?? null;
    const consignee = bol?.data?.consignee ?? ci?.data?.consignee ?? null;
    const transport = bol?.data?.transportDetail ?? ci?.data?.transportDetail ?? null;

    const isFob = ci?.data?.documentDetail.termOfShipment === 'FOB';

    const totalNetWeight = useMemo(() => {
        if (!pl?.data?.cargoDetail?.length) return '';
        const total = pl.data.cargoDetail.reduce((acc, item) => acc + (parseFloat(item.netWeight) || 0), 0);
        return total === 0 ? '' : String(total);
    }, [pl?.data]);

    const cargoCountMismatch =
        !!ci?.data?.cargoDetail?.length &&
        !!pl?.data?.cargoDetail?.length &&
        ci.data.cargoDetail.length !== pl.data.cargoDetail.length;

    const mergedCargo: MergedCargoItem[] = useMemo(() => {
        if (!ci?.data?.cargoDetail?.length) return [];
        return ci.data.cargoDetail.map((ciItem, index) => {
            const plItem = pl?.data?.cargoDetail[index];
            return {
                descriptionOfGoods: ciItem.descriptionOfGoods,
                type: ciItem.type,
                brand: ciItem.brand,
                netWeight: plItem?.netWeight ?? '',
                quantityOfGoods: ciItem.quantityOfGoods,
                goodsUnitMeasurement: ciItem.goodsUnitMeasurement,
                quantityOfPackage: ciItem.quantityOfPackage,
                packageUnitMeasurement: ciItem.packageUnitMeasurement,
                price: ciItem.priceOfGoods ? `${ciItem.priceOfGoods} ${ciItem.currency}` : '',
            };
        });
    }, [ci?.data, pl?.data]);

    const submitWarnings = useMemo(() => {
        const warnings: string[] = [];
        if (cargoCountMismatch) {
            warnings.push(
                `Jumlah item cargo di Commercial Invoice (${ci?.data?.cargoDetail?.length}) tidak sama dengan Packing List (${pl?.data?.cargoDetail?.length}). Net weight per item mungkin tidak sesuai.`
            );
        }
        return warnings;
    }, [cargoCountMismatch, ci?.data?.cargoDetail?.length, pl?.data?.cargoDetail?.length]);

    const handleSubmitClick = () => {
        if (!allComplete || isSubmitting) return;
        setSubmitError(null);
        setShowConfirm(true);
    };

    const handleConfirmSubmit = () => {
        if (isSubmitting || !assignmentNoRef) return;
        setIsSubmitting(true);
        setSubmitError(null);
        router.post(`/submit-berkas/${assignmentNoRef}/finalize`, {}, {
            onSuccess: () => {
                setShowConfirm(false);
                setIsSubmitting(false);
                if (onFinished) {
                    onFinished();
                }
            },
            onError: (errors: Record<string, any>) => {
                let message = 'Gagal mengirim berkas. Silakan coba lagi.';
                if (typeof errors === 'string') {
                    message = errors;
                } else if (errors && typeof errors === 'object') {
                    const values = Object.values(errors).flat() as string[];
                    if (values.length > 0) {
                        message = values.join(' ');
                    }
                }
                setSubmitError(message);
                setIsSubmitting(false);
                setShowConfirm(false);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };


    const revisedStepsWithRemarks = useMemo(() => {
        const items: { label: string; remarks: string; index: number }[] = [];
        if (bol?.remarks) items.push({ label: 'Bill of Lading', remarks: bol.remarks, index: 0 });
        if (ci?.remarks) items.push({ label: 'Commercial Invoice', remarks: ci.remarks, index: 1 });
        if (pl?.remarks) items.push({ label: 'Packing List', remarks: pl.remarks, index: 2 });
        if (coo?.remarks) items.push({ label: 'Certificate of Origin (COO)', remarks: coo.remarks, index: 3 });
        if (insurance?.remarks) items.push({ label: 'Insurance', remarks: insurance.remarks, index: 4 });
        return items;
    }, [bol?.remarks, ci?.remarks, pl?.remarks, coo?.remarks, insurance?.remarks]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {revisedStepsWithRemarks.length > 0 && (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        padding: '10px 14px',
                        background: '#FEF3C7',
                        border: '1px solid #FCD34D',
                        borderRadius: 8,
                        fontSize: 12,
                        width: 'fit-content',
                        maxWidth: '100%',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AlertCircle size={14} color="#B45309" />
                        <span style={{ fontWeight: 700, color: '#78350F', fontSize: 12 }}>
                            Catatan Revisi dari Verifikator:
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 20 }}>
                        {revisedStepsWithRemarks.map((item) => (
                            <div key={item.index} style={{ fontSize: 12, color: '#92400E', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <strong style={{ color: '#78350F' }}>• {item.label}:</strong>
                                <span>{item.remarks}</span>
                                <button
                                    type="button"
                                    onClick={() => goToStep(item.index)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#0284C7',
                                        cursor: 'pointer',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        padding: 0,
                                        marginLeft: 2,
                                    }}
                                >
                                    (Ubah Step)
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {incompleteSteps.length > 0 && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: '16px 20px',
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        borderRadius: 12,
                    }}
                >
                    <AlertTriangle size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#DC2626' }}>
                            Ada step yang belum lengkap
                        </p>
                        <p style={{ margin: '4px 0 10px', fontSize: 13, color: '#7F1D1D' }}>
                            Lengkapi step berikut sebelum submit berkas:
                        </p>
                        <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 13, color: '#7F1D1D' }}>
                            {incompleteSteps.map((s) => (
                                <li key={s.index}>
                                    <button
                                        type="button"
                                        onClick={() => goToStep(s.index)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#DC2626',
                                            textDecoration: 'underline',
                                            cursor: 'pointer',
                                            fontSize: 13,
                                            fontWeight: 600,
                                            padding: 0,
                                        }}
                                    >
                                        {s.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            <SummaryCard
                icon={<Users size={17} color="#06283A" />}
                title="1. Shipper"
                rows={[
                    { label: 'Name', value: shipper?.name ?? '' },
                    { label: 'Address', value: shipper?.address ?? '' },
                    { label: 'Tax ID', value: shipper?.taxId ?? '' },
                ]}
            />

            <SummaryCard
                icon={<Users size={17} color="#06283A" />}
                title="2. Consignee"
                rows={[
                    { label: 'Name', value: consignee?.name ?? '' },
                    { label: 'Address', value: consignee?.address ?? '' },
                    { label: 'Tax ID', value: consignee?.taxId ?? '' },
                ]}
            />

            <SummaryCard
                icon={<Ship size={17} color="#06283A" />}
                title="3. Transport Detail"
                rows={[
                    { label: 'Shipp Name', value: transport?.shippName ?? '' },
                    { label: 'Voyage', value: transport?.voyage ?? '' },
                    { label: 'Port of Loading', value: transport?.portOfLoading ?? '' },
                    { label: 'Port of Discharge', value: transport?.portOfDischarge ?? '' },
                ]}
            />

            <SummaryCard
                icon={<FileText size={17} color="#06283A" />}
                title="4. Commercial Invoice"
                rows={[
                    { label: 'Number', value: ci?.data?.documentDetail?.number ?? '' },
                    { label: 'Date', value: ci?.data?.documentDetail?.date ?? '' },
                    { label: 'Term of Shipment', value: ci?.data?.documentDetail?.termOfShipment ?? '' },
                ]}
            />

            <SummaryCard
                icon={<FileText size={17} color="#06283A" />}
                title="5. Bill of Lading"
                rows={[
                    { label: 'Number', value: bol?.data?.documentDetail?.number ?? '' },
                    { label: 'Date', value: bol?.data?.documentDetail?.date ?? '' },
                ]}
            />

            <SummaryCard
                icon={<FileText size={17} color="#06283A" />}
                title="6. Packing List"
                rows={[
                    { label: 'Number', value: pl?.data?.documentDetail?.number ?? '' },
                    { label: 'Date', value: pl?.data?.documentDetail?.date ?? '' },
                ]}
            />

            <SummaryCard
                icon={<FileText size={17} color="#06283A" />}
                title="7. Certificate of Origin (COO)"
                rows={[
                    { label: 'Number', value: coo?.data?.documentDetail?.number ?? '' },
                    { label: 'Date', value: coo?.data?.documentDetail?.date ?? '' },
                ]}
            />

            <SummaryCard
                icon={<Calculator size={17} color="#06283A" />}
                title="8. Nilai & Bobot"
                rows={[
                    {
                        label: 'Premi Insurance (CI)',
                        value:
                            isFob && ci?.data?.documentDetail?.insurance
                                ? `${ci.data.documentDetail.insurance} ${ci.data.documentDetail.insuranceCurrency || ''}`
                                : '',
                    },
                    {
                        label: 'Ocean Freight',
                        value:
                            isFob && ci?.data?.documentDetail?.oceanFreight
                                ? `${ci.data.documentDetail.oceanFreight} ${ci.data.documentDetail.oceanFreightCurrency || ''}`
                                : '',
                    },
                    {
                        label: 'Total of Package',
                        value: ci?.data?.totalQuantity?.totalPackages
                            ? `${ci.data.totalQuantity.totalPackages} ${ci.data.totalQuantity.totalPackagesUnit || ''}`
                            : '',
                    },
                    {
                        label: 'Total Gross Weight',
                        value: bol?.data?.quantity?.totalGrossWeight
                            ? `${bol.data.quantity.totalGrossWeight} ${bol.data.quantity.totalGrossWeightUnit || ''}`
                            : '',
                    },
                    {
                        label: 'Total Net Weight',
                        value: totalNetWeight ? `${totalNetWeight} kg` : '',
                    },
                    {
                        label: 'Total Volume',
                        value: bol?.data?.quantity?.totalVolume
                            ? `${bol.data.quantity.totalVolume} ${bol.data.quantity.totalVolumeUnit || ''}`
                            : '',
                    },
                ]}
            />

            <div style={cardStyle}>
                <div style={cardHeaderStyle}>
                    <Package size={17} color="#06283A" />
                    <p style={cardTitleStyle}>9. Cargo Detail</p>
                </div>

                {cargoCountMismatch && (
                    <div
                        style={{
                            display: 'flex',
                            gap: 8,
                            alignItems: 'flex-start',
                            padding: '10px 20px',
                            background: '#FFFBEB',
                            borderBottom: '1px solid #F1F5F9',
                        }}
                    >
                        <AlertTriangle size={14} color="#B45309" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 12, color: '#92400E' }}>
                            Jumlah item CI ({ci?.data?.cargoDetail?.length}) dan PL (
                            {pl?.data?.cargoDetail?.length}) berbeda — net weight per item mungkin tidak
                            sesuai pasangannya.
                        </span>
                    </div>
                )}

                {mergedCargo.length === 0 ? (
                    <div style={{ padding: '16px 20px', fontSize: 13, color: '#94A3B8' }}>
                        Belum ada data cargo.
                    </div>
                ) : (
                    mergedCargo.map((item, index) => (
                        <div
                            key={index}
                            style={{
                                padding: '14px 20px',
                                borderBottom: index === mergedCargo.length - 1 ? 'none' : '1px solid #F1F5F9',
                            }}
                        >
                            <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#06283A' }}>
                                Item {index + 1}: {item.descriptionOfGoods || '—'}
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 12 }}>
                                <span style={rowLabelStyle}>Type</span>
                                <span style={{ ...rowValueStyle, textAlign: 'left' }}>{item.type || '—'}</span>

                                <span style={rowLabelStyle}>Brand</span>
                                <span style={{ ...rowValueStyle, textAlign: 'left' }}>{item.brand || '—'}</span>

                                <span style={rowLabelStyle}>Net Weight</span>
                                <span style={{ ...rowValueStyle, textAlign: 'left' }}>{item.netWeight ? `${item.netWeight} kg` : '—'}</span>

                                <span style={rowLabelStyle}>Quantity of Goods</span>
                                <span style={{ ...rowValueStyle, textAlign: 'left' }}>
                                    {item.quantityOfGoods ? `${item.quantityOfGoods} ${item.goodsUnitMeasurement}` : '—'}
                                </span>

                                <span style={rowLabelStyle}>Quantity of Package</span>
                                <span style={{ ...rowValueStyle, textAlign: 'left' }}>
                                    {item.quantityOfPackage ? `${item.quantityOfPackage} ${item.packageUnitMeasurement}` : '—'}
                                </span>

                                <span style={rowLabelStyle}>Price</span>
                                <span style={{ ...rowValueStyle, textAlign: 'left' }}>{item.price || '—'}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {submitError && (
                <div
                    style={{
                        padding: '12px 16px',
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        borderRadius: 8,
                        color: '#DC2626',
                        fontSize: 13,
                    }}
                >
                    {submitError}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <button
                    type="button"
                    onClick={goBack}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '11px 20px',
                        borderRadius: 10,
                        border: '1px solid #E2E8F0',
                        background: '#fff',
                        color: '#374151',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >
                    <ChevronLeft size={16} />
                    Kembali
                </button>

                <button
                    type="button"
                    onClick={handleSubmitClick}
                    disabled={!allComplete || isSubmitting}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '11px 24px',
                        borderRadius: 10,
                        border: 'none',
                        background: allComplete ? 'linear-gradient(135deg, #06283A, #0A3D5C)' : '#CBD5E1',
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: allComplete && !isSubmitting ? 'pointer' : 'not-allowed',
                    }}
                >
                    <CheckCircle2 size={17} />
                    {isSubmitting ? 'Mengirim...' : 'Submit Berkas'}
                </button>
            </div>

            <ConfirmSubmitModal
                open={showConfirm}
                onConfirm={handleConfirmSubmit}
                onCancel={() => (!isSubmitting ? setShowConfirm(false) : undefined)}
                isSubmitting={isSubmitting}
                warnings={submitWarnings}
            />
        </div>
    );
}
