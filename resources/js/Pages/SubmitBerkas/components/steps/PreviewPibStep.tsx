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

/**
 * Simple, dependency-free confirmation modal.
 * Shown right before the final POST so the user has a last chance to review.
 */
function ConfirmSubmitModal({
    open,
    onConfirm,
    onCancel,
    isSubmitting,
    warnings,
}: {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    isSubmitting: boolean;
    warnings: string[];
}) {
    if (!open) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-submit-title"
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(6, 40, 58, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: 16,
            }}
            onClick={onCancel}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#fff',
                    borderRadius: 14,
                    width: '100%',
                    maxWidth: 440,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        padding: '20px 22px 0',
                    }}
                >
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div
                            style={{
                                width: 38,
                                height: 38,
                                borderRadius: '50%',
                                background: '#EFF6FF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <CheckCircle2 size={20} color="#06283A" />
                        </div>
                        <div>
                            <p
                                id="confirm-submit-title"
                                style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#06283A' }}
                            >
                                Submit berkas PIB?
                            </p>
                            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
                                Pastikan seluruh data sudah benar. Setelah dikirim, dokumen tidak dapat diedit
                                kembali dari step ini.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        aria-label="Tutup"
                        style={{
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            padding: 4,
                            color: '#9CA3AF',
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {warnings.length > 0 && (
                    <div
                        style={{
                            margin: '16px 22px 0',
                            padding: '10px 12px',
                            background: '#FFFBEB',
                            border: '1px solid #FDE68A',
                            borderRadius: 8,
                        }}
                    >
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                            <AlertTriangle size={16} color="#B45309" style={{ flexShrink: 0, marginTop: 1 }} />
                            <div>
                                <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: '#92400E' }}>
                                    Periksa kembali sebelum submit
                                </p>
                                <ul style={{ margin: '4px 0 0', paddingLeft: 16, fontSize: 12, color: '#92400E' }}>
                                    {warnings.map((w, i) => (
                                        <li key={i} style={{ marginBottom: 2 }}>
                                            {w}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

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

export function PreviewPibStep() {
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

    // --- Cargo merge (by index, with mismatch detection) ---------------------
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

    // Warnings shown inside the confirmation modal
    const submitWarnings = useMemo(() => {
        const warnings: string[] = [];
        if (cargoCountMismatch) {
            warnings.push(
                `Jumlah item cargo di Commercial Invoice (${ci?.data?.cargoDetail?.length}) tidak sama dengan Packing List (${pl?.data?.cargoDetail?.length}). Net weight per item mungkin tidak sesuai.`
            );
        }
        return warnings;
    }, [cargoCountMismatch, ci?.data?.cargoDetail?.length, pl?.data?.cargoDetail?.length]);

    // Step 1: user clicks "Submit Berkas" -> opens confirmation modal
    const handleSubmitClick = () => {
        if (!allComplete || isSubmitting) return;
        setSubmitError(null);
        setShowConfirm(true);
    };

    // Step 2: user confirms inside modal -> actual POST request via Inertia.js
    const handleConfirmSubmit = () => {
        if (isSubmitting || !assignmentNoRef) return;
        setIsSubmitting(true);
        setSubmitError(null);

        // Mengirim request POST ke route finalize backend dengan path parameter assignmentNoRef
        router.post(`/submit-berkas/${assignmentNoRef}/finalize`, {}, {
            onError: (errors) => {
                const message = typeof errors === 'string'
                    ? errors
                    : errors?.message || 'Gagal mengirim berkas. Silakan coba lagi.';
                setSubmitError(message);
                setIsSubmitting(false);
                setShowConfirm(false);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {incompleteSteps.map((s) => (
                                <button
                                    key={s.index}
                                    type="button"
                                    onClick={() => goToStep(s.index)}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: 8,
                                        border: '1px solid #FCA5A5',
                                        background: '#fff',
                                        color: '#DC2626',
                                        fontSize: 12,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
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
                    { label: 'Port of Loading', value: transport?.portOfLoading ?? '' },
                    { label: 'Port of Discharge', value: transport?.portOfDischarge ?? '' },
                    { label: 'Shipp Name', value: transport?.shippName ?? '' },
                    { label: 'Voyage', value: transport?.voyage ?? '' },
                ]}
            />

            <SummaryCard
                icon={<FileText size={17} color="#06283A" />}
                title="4. Commercial Invoice"
                rows={[
                    { label: 'Number', value: ci?.data?.documentDetail.number ?? '' },
                    { label: 'Date', value: ci?.data?.documentDetail.date ?? '' },
                ]}
            />

            <SummaryCard
                icon={<FileText size={17} color="#06283A" />}
                title="5. Bill of Lading"
                rows={[
                    { label: 'Number', value: bol?.data?.documentDetail.number ?? '' },
                    { label: 'Date', value: bol?.data?.documentDetail.date ?? '' },
                ]}
            />

            <SummaryCard
                icon={<FileText size={17} color="#06283A" />}
                title="6. Packing List"
                rows={[
                    { label: 'Number', value: pl?.data?.documentDetail.number ?? '' },
                    { label: 'Date', value: pl?.data?.documentDetail.date ?? '' },
                ]}
            />

            <SummaryCard
                icon={<FileText size={17} color="#06283A" />}
                title="7. Certificate of Origin (COO)"
                rows={[
                    { label: 'Number', value: coo?.data?.documentDetail.number ?? '' },
                    { label: 'Date', value: coo?.data?.documentDetail.date ?? '' },
                ]}
            />

            <SummaryCard
                icon={<Calculator size={17} color="#06283A" />}
                title="Ringkasan Nilai & Kuantitas"
                rows={[
                    {
                        label: '8. Total Price of Goods',
                        value: ci?.data?.totalQuantity.totalPrice
                            ? `${ci.data.totalQuantity.totalPrice} ${ci.data.totalQuantity.totalPriceCurrency}`
                            : '',
                    },
                    {
                        label: '9. Premi Insurance (CI)',
                        value:
                            isFob && ci?.data?.documentDetail.insurance
                                ? `${ci.data.documentDetail.insurance} ${ci.data.documentDetail.insuranceCurrency}`
                                : '',
                    },
                    {
                        label: '10. Ocean Freight',
                        value:
                            isFob && ci?.data?.documentDetail.oceanFreight
                                ? `${ci.data.documentDetail.oceanFreight} ${ci.data.documentDetail.oceanFreightCurrency}`
                                : '',
                    },
                    {
                        label: '11. Total of Package',
                        value: ci?.data?.totalQuantity.totalPackages
                            ? `${ci.data.totalQuantity.totalPackages} ${ci.data.totalQuantity.totalPackagesUnit}`
                            : '',
                    },
                    {
                        label: '12. Total Gross Weight',
                        value: bol?.data?.quantity.totalGrossWeight
                            ? `${bol.data.quantity.totalGrossWeight} ${bol.data.quantity.totalGrossWeightUnit}`
                            : '',
                    },
                    {
                        label: '13. Total Net Weight',
                        value: totalNetWeight ? `${totalNetWeight} kg` : '',
                    },
                    {
                        label: '14. Total Volume',
                        value: bol?.data?.quantity.totalVolume
                            ? `${bol.data.quantity.totalVolume} ${bol.data.quantity.totalVolumeUnit}`
                            : '',
                    },
                ]}
            />

            <div style={cardStyle}>
                <div style={cardHeaderStyle}>
                    <Package size={17} color="#06283A" />
                    <p style={cardTitleStyle}>15. Cargo Detail</p>
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